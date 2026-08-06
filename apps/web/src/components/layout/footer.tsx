import { HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/index.js";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          <HeartHandshake className="size-4 text-primary" />
          <span>
            {t("footer.builtWith")} ·{" "}
            <span className="text-foreground">{t("brand.name")}</span>
          </span>
        </div>
        <nav
          className="flex items-center gap-5 text-sm text-muted"
          aria-label={t("footer.navAria")}
        >
          <Link
            to="/health"
            className="transition-colors hover:text-foreground"
          >
            {t("footer.health")}
          </Link>
          <a href="#" className="transition-colors hover:text-foreground">
            {t("footer.privacy")}
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            {t("footer.contact")}
          </a>
        </nav>
      </div>
    </footer>
  );
}
