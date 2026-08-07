import { Input } from "@family/ui";
import type { NlResponse } from "@family/core";
import { Search, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  flattenSearchItems,
  SearchResults,
} from "../components/search/search-results.js";
import { NaturalSearchPanel } from "../components/search/natural-search-panel.js";
import { useGlobalSearch } from "../components/search/use-global-search.js";
import { useNaturalSearch } from "../components/search/use-natural-search.js";
import { useI18n } from "../i18n/index.js";
import { useSeo } from "../lib/seo.js";

export function SearchPage() {
  const { t } = useI18n();
  useSeo("search.title");
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [term, setTerm] = useState(searchParams.get("q") ?? "");

  const { data, isFetching, isError } = useGlobalSearch(term, true, 10);
  const natural = useNaturalSearch(term, true);

  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length >= 2) {
      setTerm(q);
      setSearchParams({ q }, { replace: true });
    }
  }

  const items = data ? flattenSearchItems(data) : [];

  // When the local AI parser understood the query (an answer, or a routed
  // dataset), show the AI panel; otherwise fall back to the plain grouped
  // search across everything.
  const aiRouted =
    natural.data !== undefined &&
    (natural.data.answer !== null || natural.data.intent !== "all");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">{t("search.title")}</h1>
      <p className="mt-1 text-sm text-muted">
        People, photos, moments, events, documents and chat — one bar.
      </p>

      <form onSubmit={submit} className="relative mt-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          className="h-12 pl-10 pr-10 text-base"
          autoFocus
        />
        {isFetching && (
          <span className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-pulse rounded-full border-2 border-primary/40 border-t-primary" />
        )}
      </form>

      {term.trim().length < 2 ? (
        <p className="mt-10 text-center text-sm text-muted">{t("search.hint")}</p>
      ) : isError && !data ? (
        <p className="mt-10 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-center text-sm font-medium text-error">
          Couldn't search right now — please try again.
        </p>
      ) : aiRouted ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-3 shadow-sm">
          <NaturalSearchPanel
            data={natural.data}
            isFetching={natural.isFetching}
          />
          {natural.data &&
            natural.data.answer === null &&
            natural.data.intent !== "all" &&
            naturalIsEmpty(natural.data) && (
              <p className="px-3 py-8 text-center text-sm text-muted">
                {t("search.noResults", { q: term })}
              </p>
            )}
        </div>
      ) : data && items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <SearchX className="size-10 text-muted" />
          <p className="text-muted">{t("search.noResults", { q: term })}</p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-3 shadow-sm">
          <SearchResults items={items} withGroupHeaders />
        </div>
      )}
    </div>
  );
}

function naturalIsEmpty(data: NlResponse): boolean {
  return (
    data.people.length === 0 &&
    data.photos.length === 0 &&
    data.events.length === 0 &&
    data.documents.length === 0
  );
}