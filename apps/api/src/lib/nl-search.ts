import type { NlBirthdayAnswer, NlDataset, NlIntent } from "@family/core";

/**
 * Rule-based natural-language search ("AI") over family data.
 *
 * Everything happens in-process — no external model, no network calls, no
 * family data leaves the server. The parser turns a plain-English question
 * into an intent + filters, then the route resolves them against Mongo.
 */

/** Minimal member shape the parser needs for name resolution. */
export interface NlMember {
  id: string;
  name: string;
}

/** Member extended with birth date for birthday answers. */
export interface NlMemberBirthday extends NlMember {
  dateOfBirth: Date;
}

export interface NlParseResult {
  intent: NlIntent;
  dataset: NlDataset;
  /** Residual free-text keyword (caption/name/document match), if any. */
  keywords?: string;
  /** Member matched by name in the query, if any. */
  personName?: string;
  personId?: string;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Words that carry no filter meaning and are dropped from the keyword. */
const STOP_WORDS = new Set([
  "show",
  "find",
  "get",
  "give",
  "want",
  "see",
  "look",
  "please",
  "can",
  "could",
  "would",
  "all",
  "any",
  "some",
  "many",
  "from",
  "with",
  "for",
  "of",
  "to",
  "in",
  "on",
  "at",
  "about",
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "be",
  "has",
  "have",
  "had",
  "does",
  "do",
  "did",
  "when",
  "what",
  "where",
  "who",
  "whose",
  "which",
  "how",
  "and",
  "or",
  "but",
  "so",
  "i",
  "you",
  "we",
  "my",
  "me",
  "mine",
  "our",
  "this",
  "that",
  "there",
  "here",
  "year",
  "month",
  "day",
  "shared",
  "ask",
  "tell",
]);

/** Dataset words that carry no filter value and are dropped. */
const GENERIC_ITEMS: Record<NlDataset, string[]> = {
  all: [],
  people: ["people", "person", "member", "family"],
  photos: ["photos", "photo", "picture", "pictures", "pics", "pic", "images", "image", "album"],
  events: ["events", "event", "gathering", "get", "together", "program", "function"],
  documents: ["documents", "document", "doc", "docs", "file", "files", "paper"],
};

const BIRTHDAY_WORDS = new Set(["birthday", "birth", "born", "जन्मदिन", "जन्म"]);
const PHOTO_WORDS = new Set([...GENERIC_ITEMS.photos, "फोटो"]);
/**
 * Specific document words trigger the documents dataset AND stay in the
 * keyword ("find passport" → keyword "passport").
 */
const DOC_WORDS = new Set([
  ...GENERIC_ITEMS.documents,
  "passport",
  "passports",
  "form",
  "forms",
  "certificate",
  "certificates",
  "agreement",
  "agreements",
  "दस्तावेज़",
  "पासपोर्ट",
]);
const EVENT_WORDS = new Set([
  ...GENERIC_ITEMS.events,
  "festival",
  "trip",
  "visit",
  "पार्टी",
  "उत्सव",
]);

function words(query: string): string[] {
  return query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/**
 * Detect person references. Matches a member's full name or its first word
 * as a whole word, so "mom" finds "Mom Alice" but not "moments".
 */
function findMember(query: string, members: NlMember[]): { name: string; id: string } | undefined {
  const lower = query.toLowerCase();
  for (const member of members) {
    const full = member.name.toLowerCase();
    if (lower.includes(full)) return member;
    const first = full.split(/\s+/)[0] ?? "";
    if (first.length > 2 && new RegExp(`\\b${escapeRegex(first)}\\b`, "i").test(query)) {
      return member;
    }
  }
  return undefined;
}

/** Parse a plain-English query into an intent plus filters. */
export function parseNlQuery(
  query: string,
  members: NlMember[],
): NlParseResult {
  const lower = query.toLowerCase();
  const w = words(lower);
  const person = findMember(query, members);

  // Intent detection takes precedence so "photos from Diwali" routes to photos.
  let intent: NlIntent = "all";
  if (w.some((word) => BIRTHDAY_WORDS.has(word))) intent = "birthday";
  else if (w.some((word) => PHOTO_WORDS.has(word))) intent = "photos";
  else if (/shared\s+with\s+me|for\s+me/i.test(lower)) intent = "documents";
  else if (w.some((word) => DOC_WORDS.has(word))) intent = "documents";
  else if (w.some((word) => EVENT_WORDS.has(word))) intent = "events";
  else if (/^who\s+(is|are)|profile\s+of/i.test(lower)) intent = "person";

  const dataset: NlDataset =
    intent === "person" || intent === "birthday" ? "people" : intent;

  // Residual keyword: strip stop words, generic dataset words and the
  // matched person's name, keep the rest (e.g. "Diwali", "passport").
  const personNameWords = new Set(
    person ? person.name.toLowerCase().split(/\s+/) : [],
  );
  const keywordParts: string[] = [];
  for (const word of w) {
    if (STOP_WORDS.has(word)) continue;
    if (dataset !== "all" && GENERIC_ITEMS[dataset].includes(word)) continue;
    if (personNameWords.has(word)) continue;
    keywordParts.push(word);
  }
  const keywords = keywordParts.length ? keywordParts.join(" ") : undefined;

  return {
    intent,
    dataset,
    keywords,
    personName: person?.name,
    personId: person?.id,
  };
}

// --- birthday answers --------------------------------------------------

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * The next real date the member's birthday falls on (leap-day safe).
 * A date-only comparison: a birthday today counts as 0 days away.
 */
export function nextOccurrence(dateOfBirth: Date, from = new Date()): Date {
  const bornMonth = dateOfBirth.getMonth();
  const bornDay = dateOfBirth.getDate();
  const clamp = (year: number) => Math.min(bornDay, daysInMonth(bornMonth, year));

  const thisYear = new Date(from.getFullYear(), bornMonth, clamp(from.getFullYear()));
  if (thisYear >= from) return thisYear;
  return new Date(from.getFullYear() + 1, bornMonth, clamp(from.getFullYear() + 1));
}

/** Whole days until the next occurrence of the member's birthday. */
export function daysUntilBirthday(dateOfBirth: Date, from: Date): number {
  const next = nextOccurrence(dateOfBirth, from);
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(next.getFullYear(), next.getMonth(), next.getDate());
  return Math.round((end - start) / 86_400_000);
}

/**
 * Answer a birthday question. With a person reference, answer for them;
 * otherwise the closest upcoming birthday in the family.
 */
export function resolveBirthday(
  members: NlMemberBirthday[],
  personId?: string,
  from = new Date(),
): NlBirthdayAnswer {
  let target =
    personId !== undefined ? members.find((m) => m.id === personId) : undefined;
  if (target === undefined) {
    let targetDays = Infinity;
    for (const member of members) {
      const days = daysUntilBirthday(member.dateOfBirth, from);
      if (days < targetDays) {
        target = member;
        targetDays = days;
      }
    }
  }

  const chosen = target ?? members[0]!;
  return {
    kind: "birthday",
    member: {
      id: chosen.id,
      name: chosen.name,
      dateOfBirth: chosen.dateOfBirth,
    },
    nextOccurrence: nextOccurrence(chosen.dateOfBirth, from),
    daysUntil: daysUntilBirthday(chosen.dateOfBirth, from),
  };
}