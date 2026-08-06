import { HeartHandshake } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
      <Link
        to="/"
        className="mb-8 flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-fg shadow-sm">
          <HeartHandshake className="size-5" />
        </span>
        <span className="font-display text-xl font-semibold tracking-tight">
          Kulaya
        </span>
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-card">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
