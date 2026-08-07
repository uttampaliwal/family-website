import { Button } from "@family/ui";
import { Loader2, Search, SearchX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/index.js";
import {
  flattenSearchItems,
  SearchResults,
} from "./search-results.js";
import { useGlobalSearch } from "./use-global-search.js";
import { useNaturalSearch } from "./use-natural-search.js";
import { NaturalSearchPanel } from "./natural-search-panel.js";

export function GlobalSearch() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data, isFetching, isError } = useGlobalSearch(term, open);
  const natural = useNaturalSearch(term, open);

  const items = useMemo(() => (data ? flattenSearchItems(data) : []), [data]);

  // Debounce keystrokes so the server isn't hammered per character.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(query);
      setActiveIndex(-1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Close when the route changes (e.g. after choosing a result).
  useEffect(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, [pathname]);

  // ⌘K / Ctrl+K toggles the bar from anywhere in the app.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Clicking outside closes the panel.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!event.target) return;
      const node = event.target as Node;
      if (!containerRef.current?.contains(node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function go(to: string) {
    navigate(to);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (items.length) setActiveIndex((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (items.length) {
        setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
      }
    } else if (event.key === "Enter") {
      const target = activeIndex >= 0 ? items[activeIndex] : null;
      if (target) go(target.to);
      else if (term.trim().length >= 2) go(`/search?q=${encodeURIComponent(term.trim())}`);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("search.open")}
        aria-expanded={open}
        title={`${t("search.open")} (⌘K)`}
        className="hidden items-center gap-1.5 sm:inline-flex"
      >
        <Search className="size-4" />
        <span className="hidden xl:inline">{t("search.open")}</span>
      </Button>
      {/* Mobile: a compact icon button keeps the search tap-accessible. */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("search.open")}
        className="sm:hidden"
      >
        <Search className="size-4" />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label={t("search.label")}
          className="absolute right-0 top-12 z-50 w-[min(92vw,32rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="size-4 shrink-0 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t("search.placeholder")}
              aria-label={t("search.label")}
              className="w-full bg-transparent text-sm outline-none"
              autoComplete="off"
            />
            {isFetching && <Loader2 className="size-4 shrink-0 animate-spin text-muted" />}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            <NaturalSearchPanel
              data={natural.data}
              isFetching={natural.isFetching}
              mode="card"
            />
            {term.trim().length < 2 ? (
              <p className="px-3 py-8 text-center text-sm text-muted">{t("search.hint")}</p>
            ) : isError && !data ? (
              <p className="px-3 py-8 text-center text-sm text-error">
                Couldn't search right now.
              </p>
            ) : data && items.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted">
                <SearchX className="mx-auto mb-2 size-6" />
                {t("search.noResults", { q: term })}
              </div>
            ) : (
              <SearchResults
                items={items}
                activeIndex={activeIndex}
                onHoverItem={setActiveIndex}
              />
            )}
          </div>

          {items.length > 0 && (
            <p className="border-t border-border px-3 py-2 text-[11px] text-muted">
              ↑↓ navigate · Enter open · Esc close
            </p>
          )}
        </div>
      )}
    </div>
  );
}