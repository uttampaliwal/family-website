import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@family/ui";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/index.js";

export function InfoPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
      </header>
      <div className="space-y-10 rounded-2xl border border-border bg-surface/40 p-6 sm:p-8">
        {children}
      </div>
      <div className="mt-8 text-center">
        <Button asChild variant="ghost">
          <Link to="/">
            <ArrowLeft />
            {t("legal.backToHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function InfoSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-3 text-base font-bold sm:text-lg">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-fg sm:size-8">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}