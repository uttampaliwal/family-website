import type { NlResponse, SearchResponse } from "@family/core";
import { Sparkles } from "lucide-react";
import { useI18n } from "../../i18n/index.js";
import {
  flattenSearchItems,
  SearchResults,
} from "./search-results.js";

/**
 * The "AI" surface for natural-language search. When the local rule-based
 * parser produced a direct answer (e.g. a birthday) we show it as a
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
      <p className="px-3 py-6 text-center text-sm text-muted">
        <Sparkles className="mx-auto mb-2 size-5 animate-pulse text-primary" />
        {t("search.ai.thinking")}
      </p>
    );
  }
  if (!data) return null;

  const items = flattenSearchItems(nlToSearchResponse(data));

  return (
    <div>
      {data.answer?.kind === "birthday" && (
        <BirthdayAnswer
          name={data.answer.member.name}
          date={formatDay(data.answer.member.dateOfBirth)}
          next={formatDate(data.answer.nextOccurrence)}
          days={data.answer.daysUntil}
        />
      )}
      {mode === "panel" && items.length > 0 && (
        <SearchResults items={items} withGroupHeaders />
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
    <div className="mx-3 mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="size-3.5" />
        {t("search.ai.label")}
      </p>
      <p className="mt-1 text-sm font-medium">
        {t("search.ai.birthday", { name, date })}
      </p>
      <p className="mt-0.5 text-xs text-muted">
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