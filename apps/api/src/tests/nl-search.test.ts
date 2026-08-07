import { describe, expect, it } from "vitest";
import {
  daysUntilBirthday,
  nextOccurrence,
  parseNlQuery,
  resolveBirthday,
  type NlMember,
  type NlMemberBirthday,
} from "../lib/nl-search.js";

const family: NlMember[] = [
  { id: "a1", name: "Mom Alice" },
  { id: "a2", name: "Grandpa Raj" },
  { id: "a3", name: "Tiny Riya" },
];

const birthdays: NlMemberBirthday[] = [
  { id: "a1", name: "Mom Alice", dateOfBirth: new Date(1985, 4, 20) },
  { id: "a2", name: "Grandpa Raj", dateOfBirth: new Date(1950, 7, 5) },
  { id: "a3", name: "Tiny Riya", dateOfBirth: new Date(2015, 10, 12) },
];

describe("parseNlQuery", () => {
  it("routes 'show photos from Diwali' to photos with a keyword", () => {
    const result = parseNlQuery("show photos from Diwali", family);
    expect(result.intent).toBe("photos");
    expect(result.dataset).toBe("photos");
    expect(result.keywords).toBe("diwali");
    expect(result.personName).toBeUndefined();
  });

  it("routes 'find passport' to documents with a keyword", () => {
    const result = parseNlQuery("find passport", family);
    expect(result.intent).toBe("documents");
    expect(result.dataset).toBe("documents");
    expect(result.keywords).toBe("passport");
  });

  it("routes 'show documents shared with me' to all documents", () => {
    const result = parseNlQuery("show documents shared with me", family);
    expect(result.intent).toBe("documents");
    expect(result.dataset).toBe("documents");
    expect(result.keywords).toBeUndefined();
  });

  it("detects a birthday question", () => {
    const result = parseNlQuery("When is Mom Alice birthday?", family);
    expect(result.intent).toBe("birthday");
    expect(result.dataset).toBe("people");
    expect(result.personId).toBe("a1");
  });

  it("matches the first word of a member name ('mom' → 'Mom Alice')", () => {
    const result = parseNlQuery("show photos of mom", family);
    expect(result.personName).toBe("Mom Alice");
    expect(result.personId).toBe("a1");
    expect(result.intent).toBe("photos");
  });

  it("does not match 'mom' inside 'moments'", () => {
    const result = parseNlQuery("show photos of moments", family);
    expect(result.personName).toBeUndefined();
  });

  it("routes 'who is Tiny Riya' to people", () => {
    const result = parseNlQuery("who is Tiny Riya", family);
    expect(result.intent).toBe("person");
    expect(result.dataset).toBe("people");
    expect(result.personId).toBe("a3");
  });

  it("treats a bare word as an all-dataset search", () => {
    const result = parseNlQuery("diwali", family);
    expect(result.intent).toBe("all");
    expect(result.dataset).toBe("all");
    expect(result.keywords).toBe("diwali");
  });

  it("keeps a festival name as the keyword for events", () => {
    const result = parseNlQuery("show events for Diwali dinner", family);
    expect(result.intent).toBe("events");
    expect(result.keywords).toBe("diwali dinner");
  });
});

describe("nextOccurrence", () => {
  it("returns this year when the birthday is still ahead", () => {
    const from = new Date(2026, 0, 1);
    expect(nextOccurrence(new Date(1985, 4, 20), from)).toEqual(
      new Date(2026, 4, 20),
    );
  });

  it("rolls to next year once today has passed", () => {
    const from = new Date(2026, 4, 21);
    expect(nextOccurrence(new Date(1985, 4, 20), from)).toEqual(
      new Date(2027, 4, 20),
    );
  });

  it("counts a birthday today as today (0 days)", () => {
    const from = new Date(2026, 4, 20);
    expect(daysUntilBirthday(new Date(1985, 4, 20), from)).toBe(0);
  });

  it("clamps Feb 29 to Feb 28 in non-leap years", () => {
    const from = new Date(2026, 0, 1);
    expect(nextOccurrence(new Date(2000, 1, 29), from)).toEqual(
      new Date(2026, 1, 28),
    );
  });
});

describe("resolveBirthday", () => {
  it("answers for the named person when one is given", () => {
    const answer = resolveBirthday(birthdays, "a2", new Date(2026, 0, 1));
    expect(answer.kind).toBe("birthday");
    expect(answer.member.name).toBe("Grandpa Raj");
    expect(answer.member.dateOfBirth).toEqual(new Date(1950, 7, 5));
  });

  it("picks the closest upcoming birthday when no person is named", () => {
    const from = new Date(2026, 0, 1);
    const answer = resolveBirthday(birthdays, undefined, from);
    expect(answer.member.name).toBe("Mom Alice");
    expect(answer.nextOccurrence).toEqual(new Date(2026, 4, 20));
  });
});
