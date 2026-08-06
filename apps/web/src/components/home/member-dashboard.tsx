import type { Announcement, Event } from "@family/core";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  FolderOpen,
  HeartHandshake,
  Image,
  Megaphone,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/index.js";
import { api } from "../../lib/api-client.js";
import { useAuthStore } from "../../stores/auth-store.js";

interface AnnouncementListResponse {
  items: Announcement[];
  total: number;
}

interface EventListResponse {
  items: Event[];
  total: number;
}

const quickActions = [
  { to: "/photos", icon: Image, labelKey: "nav.photos" },
  { to: "/events", icon: CalendarDays, labelKey: "nav.events" },
  { to: "/announcements", icon: Megaphone, labelKey: "nav.announcements" },
  { to: "/documents", icon: FolderOpen, labelKey: "nav.documents" },
  { to: "/moments", icon: Sparkles, labelKey: "nav.moments" },
  { to: "/chat", icon: MessageCircle, labelKey: "nav.chat" },
  { to: "/members", icon: Users, labelKey: "nav.members" },
  { to: "/family", icon: HeartHandshake, labelKey: "account.family" },
] as const;

function greeting(
  hour: number,
): "dash.goodMorning" | "dash.goodAfternoon" | "dash.goodEvening" {
  if (hour < 12) return "dash.goodMorning";
  if (hour < 17) return "dash.goodAfternoon";
  return "dash.goodEvening";
}

export function MemberDashboard() {
  const { user } = useAuthStore();
  const { t, lang } = useI18n();

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data: eventsData } = useQuery({
    queryKey: ["events", "dashboard", from.toISOString(), to.toISOString()],
    queryFn: () =>
      api.get<EventListResponse>(
        `/events?from=${from.toISOString()}&to=${to.toISOString()}`,
      ),
  });

  const { data: announcementsData } = useQuery({
    queryKey: ["announcements", "dashboard"],
    queryFn: () => api.get<AnnouncementListResponse>("/announcements"),
  });

  const nextEvent = eventsData?.items
    .filter((e) => new Date(e.startsAt) >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];

  const latest = announcementsData?.items[0];

  const dateLabel = new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Greeting */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-8 sm:p-10">
        <span className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {dateLabel}
        </p>
        <h1 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {t(greeting(now.getHours()))}
          <span className="text-primary">{t("dash.welcomeName", { name: user?.name.split(" ")[0] ?? "" })}</span>
        </h1>
      </section>

      {/* Quick actions */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">{t("dash.quickActions")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map(({ to, icon: Icon, labelKey }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-surface/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-semibold">{t(labelKey)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Around the nest */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{t("dash.updates")}</h2>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Next event */}
          <div className="rounded-2xl border border-border bg-surface/40 p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <CalendarDays className="size-4" />
              {t("dash.nextEvent")}
            </div>
            {nextEvent ? (
              <div className="mt-3">
                <p className="font-display text-lg font-bold">{nextEvent.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(nextEvent.startsAt))}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">{t("dash.noEvents")}</p>
            )}
            <Link
              to="/events"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("dash.viewAll")}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Latest announcement */}
          <div className="rounded-2xl border border-border bg-surface/40 p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <FileText className="size-4" />
              {t("dash.latestAnnouncement")}
            </div>
            {latest ? (
              <div className="mt-3">
                <p className="font-display text-lg font-bold">{latest.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{latest.body}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">{t("dash.noAnnouncements")}</p>
            )}
            <Link
              to="/announcements"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("dash.viewAll")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}