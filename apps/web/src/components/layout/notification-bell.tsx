import type { Notification as NotificationPayload, NotificationListResponse } from "@family/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCheck,
  Heart,
  Megaphone,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@family/ui";
import { useAuthStore } from "../../stores/auth-store.js";
import { api } from "../../lib/api-client.js";
import { connectSse } from "../../lib/sse.js";
import { useI18n, type Language } from "../../i18n/index.js";

const PAGE_SIZE = 20;

function relativeTime(createdAt: Date | string, lang: Language): string {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const seconds = Math.round((new Date(createdAt).getTime() - Date.now()) / 1000);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return rtf.format(Math.round(seconds / size), unit);
    }
  }
  return rtf.format(seconds, "second");
}

function typeIcon(type: NotificationPayload["type"]): ReactNode {
  switch (type) {
    case "announcement":
      return <Megaphone className="size-4" />;
    case "event":
      return <CalendarDays className="size-4" />;
    case "moment_like":
      return <Heart className="size-4" />;
    case "moment_comment":
      return <MessageCircle className="size-4" />;
    case "member_joined":
      return <UserPlus className="size-4" />;
    case "approval":
      return <BadgeCheck className="size-4" />;
  }
}

export function NotificationBell() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unread = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => api.get<{ count: number }>("/notifications/unread-count"),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const list = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () =>
      api.get<NotificationListResponse>(`/notifications?page=0&pageSize=${PAGE_SIZE}`),
    enabled: !!user,
  });

  const refresh = () => {
    void list.refetch();
    void unread.refetch();
  };

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token || !user) return;

    const controller = new AbortController();
    void connectSse(
      "/notifications/stream",
      token,
      (event) => {
        if (event.type === "notification") refresh();
      },
      controller.signal,
    );
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  async function markAllRead() {
    await api.post("/notifications/read-all", {});
    refresh();
  }

  async function openNotification(notification: NotificationPayload) {
    if (!notification.readAt) {
      void api.post(`/notifications/${notification.id}/read`, {}).catch(() => {});
      const items = list.data?.items ?? [];
      const next: NotificationPayload[] = items.map((n) =>
        n.id === notification.id ? { ...n, readAt: new Date() } : n,
      );
      queryClient.setQueryData(["notifications", "list"], {
        items: next,
        total: list.data?.total ?? 0,
        unreadCount: Math.max(0, (list.data?.unreadCount ?? 1) - 1),
      });
      void unread.refetch();
    }
    setOpen(false);
    navigate(notification.link);
  }

  const unreadCount = unread.data?.count ?? 0;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notify.open")}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative rounded-full p-2 text-muted transition-colors hover:bg-surface-2/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-semibold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("notify.title")}
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <h2 className="text-sm font-semibold">
              {t("notify.title")}
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-normal text-muted">
                  {t("notify.unread", { count: String(unreadCount) })}
                </span>
              )}
            </h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-surface-2/70"
              >
                <CheckCheck className="size-3.5" />
                {t("notify.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto" role="list">
            {!list.data || list.data.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell className="size-6 text-muted" />
                <p className="text-sm text-muted">{t("notify.empty")}</p>
              </div>
            ) : (
              list.data.items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-2/60",
                    !notification.readAt && "bg-surface-2/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
                      !notification.readAt
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-2 text-muted",
                    )}
                  >
                    {typeIcon(notification.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm leading-snug",
                        !notification.readAt ? "font-semibold" : "text-muted",
                      )}
                    >
                      {notificationTitle(notification, t)}
                    </span>
                    {notification.body && (
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {notification.body}
                      </span>
                    )}
                    <span className="mt-0.5 block text-[11px] text-muted/80">
                      {relativeTime(notification.createdAt, lang)}
                    </span>
                  </span>
                  {!notification.readAt && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Translate = ReturnType<typeof useI18n>["t"];

function notificationTitle(
  notification: NotificationPayload,
  t: Translate,
): string {
  const name = notification.actor?.name ?? "";
  switch (notification.type) {
    case "announcement":
      return t("notify.type.announcement");
    case "event":
      return t("notify.type.event");
    case "moment_like":
      return t("notify.type.moment_like", { name });
    case "moment_comment":
      return t("notify.type.moment_comment", { name });
    case "member_joined":
      return t("notify.type.member_joined", { name });
    case "approval":
      return t("notify.type.approval");
  }
}