import { Input } from "@family/ui";
import type { NlResponse } from "@family/core";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  flattenSearchItems,
  SearchResults,
} from "../components/search/search-results.js";
import { NaturalSearchPanel } from "../components/search/natural-search-panel.js";
import { NoResults } from "../components/search/no-results.js";
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
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <header className="animate-fade-up">
        <h1 className="font-display text-4xl font-bold tracking-tight">{t("search.title")}</h1>
        <p className="mt-2 text-[15px] text-muted">
          People, photos, moments, events, documents and chat — one bar.
        </p>
      </header>

      <form onSubmit={submit} className="relative mt-9">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted/70" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          className="h-13 rounded-2xl pl-11 pr-10 text-[15px] shadow-sm transition-shadow focus-visible:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]"
          autoFocus
        />
        {isFetching && (
          <span className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        )}
      </form>

      <main className="mt-12 animate-fade-in">
        {term.trim().length < 2 ? (
          <p className="py-16 text-center text-[15px] text-muted">{t("search.hint")}</p>
        ) : isError && !data ? (
          <p className="rounded-2xl border border-error/15 bg-error/5 px-6 py-10 text-center text-sm text-error">
            Couldn't search right now — please try again.
          </p>
        ) : aiRouted ? (
          <>
            <NaturalSearchPanel
              data={natural.data}
              isFetching={natural.isFetching}
            />
            {natural.data &&
              natural.data.answer === null &&
              natural.data.intent !== "all" &&
              naturalIsEmpty(natural.data) && (
                <NoResults q={term} onPick={setQuery} />
              )}
          </>
        ) : data && items.length === 0 ? (
          <NoResults q={term} onPick={setQuery} />
        ) : (
          <SearchResults items={items} withGroupHeaders />
        )}
      </main>
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