import { SearchX } from "lucide-react";
import { useI18n } from "../../i18n/index.js";

const SUGGESTION_KEYS = [
  "search.suggest.members",
  "search.suggest.photos",
  "search.suggest.events",
  "search.suggest.chat",
] as const;

export function NoResults({
  q,
  onPick,
}: {
  q: string;
  onPick?: (term: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="px-6 py-12 text-center">
      <SearchX className="mx-auto mb-3 size-6 text-muted/60" />
      <p className="text-sm text-muted">{t("search.noResults", { q })}</p>
      <p className="mt-2 text-xs text-muted/80">{t("search.noResultsSuggest")}</p>
      <ul className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {SUGGESTION_KEYS.map((key) => {
          const label = t(key);
          return onPick ? (
            <li key={key}>
              <button
                type="button"
                onClick={() => onPick(label)}
                className="rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs text-foreground transition-colors hover:bg-surface-2"
              >
                {label}
              </button>
            </li>
          ) : (
            <li
              key={key}
              className="rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs text-foreground"
            >
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}