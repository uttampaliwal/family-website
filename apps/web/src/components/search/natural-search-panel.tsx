import type { NlResponse, SearchResponse } from "@family/core";
import { Sparkles } from "lucide-react";
import { useI18n } from "../../i18n/index.js";
import {
  flattenSearchItems,
  SearchResults,
} from "./search-results.js";

/**
 * The "AI" surface for natural-language search. When the local rule-based
 * parser produced a direct answer (e.g. a birthday) we show it as a quiet,
 * highlighted card; in "panel" mode the routed dataset follows as a normal
 * result group.
 */
export function NaturalSearchPanel({
  data,
  isFetching,
  mode = "panel",
}: {
  data: NlResponse | undefined;
  isFetching?: boolean;
  mode?: "panel" | "card";
}) {
  const { t } = useI18n();

  if (mode === "panel" && isFetching && !data) {
    return (
      <p className="px-6 py-14 text-center text-sm text-muted">
        <Sparkles className="mx-auto mb-3 size-5 animate-pulse text-primary/70" />
        {t("search.ai.thinking")}
      </p>
    );
  }
  if (!data) return null;

  const items = flattenSearchItems(nlToSearchResponse(data));

  return (
    <div>
      {data.answer?.kind === "birthday" && (
        <div className="animate-fade-up">
          <BirthdayAnswer
            name={data.answer.member.name}
            date={formatDay(data.answer.member.dateOfBirth)}
            next={formatDate(data.answer.nextOccurrence)}
            days={data.answer.daysUntil}
          />
        </div>
      )}
      {mode === "panel" && items.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <SearchResults items={items} withGroupHeaders />
        </div>
      )}
    </div>
  );
}

function BirthdayAnswer({
  name,
  date,
  next,
  days,
}: {
  name: string;
  date: string;
  next: string;
  days: number;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-2 mt-2 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent p-4 sm:mx-3 sm:mt-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-3.5 animate-sparkle" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary/90">
          {t("search.ai.label")}
        </p>
      </div>
      <p className="mt-2.5 text-[15px] leading-relaxed">
        {t("search.ai.birthday", { name, date })}
      </p>
      <p className="mt-0.5 text-[13px] text-muted">
        {days === 0
          ? t("search.ai.birthdayToday", { date: next })
          : t("search.ai.birthdayNext", { date: next, days: String(days) })}
      </p>
    </div>
  );
}

function nlToSearchResponse(data: NlResponse): SearchResponse {
  return {
    q: data.query,
    people: data.people,
    photos: data.photos,
    posts: [],
    events: data.events,
    documents: data.documents,
    messages: [],
  };
}

function formatDay(value: Date | string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}