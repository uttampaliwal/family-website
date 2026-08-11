import {
  Avatar,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useToast,
} from "@family/ui";
import { FolderOpen, HeartHandshake, Languages, LogIn, LogOut, Megaphone, MessageCircle, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { can } from "@family/core";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store.js";
import { api } from "../../lib/api-client.js";
import { useI18n } from "../../i18n/index.js";
import { ThemeSwitcher } from "./theme-switcher.js";

// These are only shown to signed-in family members, so defer their code:
// search pulls in the full AI surface, the bell its polling logic.
const GlobalSearch = lazy(() =>
  import("../search/search-bar.js").then((m) => ({ default: m.GlobalSearch })),
);
const NotificationBell = lazy(() =>
  import("./notification-bell.js").then((m) => ({ default: m.NotificationBell })),
);

function SearchSuspense() {
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled
      aria-hidden
      className="hidden items-center gap-1.5 sm:inline-flex"
    >
      <Search className="size-4" />
    </Button>
  );
}

const navItems = [
  { to: "/", labelKey: "nav.home" },
  { to: "/members", labelKey: "nav.members" },
  { to: "/photos", labelKey: "nav.photos" },
  { to: "/events", labelKey: "nav.events" },
  { to: "/announcements", labelKey: "nav.announcements" },
  { to: "/documents", labelKey: "nav.documents" },
  { to: "/moments", labelKey: "nav.moments" },
  { to: "/chat", labelKey: "nav.chat" },
] as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PendingApprovalsLink() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["admin-pending-count"],
    queryFn: () => api.get<{ count: number }>("/admin/members/pending-count"),
    refetchInterval: 60_000,
  });

  return (
    <NavLink
      to="/admin/approvals"
      className={({ isActive }) =>
        cn(
          "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-surface-2 text-foreground"
            : "text-muted hover:bg-surface-2/70 hover:text-foreground",
        )
      }
    >
      {t("account.approvals")}
      {data && data.count > 0 && (
        <span className="grid min-w-5 place-items-center rounded-full bg-error px-1.5 text-xs font-semibold text-white">
          {data.count > 99 ? "99+" : data.count}
        </span>
      )}
    </NavLink>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { user, status, logout } = useAuthStore();
  const toast = useToast().toast;
  const { t, lang, setLang } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function onLogout() {
    await logout();
    toast("Signed out", { description: "See you soon." });
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl transition-all duration-300",
        scrolled ? "bg-background/85 shadow-sm" : "bg-background/60",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-fg shadow-sm transition-transform duration-300 group-hover:scale-105">
            <HeartHandshake className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Kulaya
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label={t("nav.mainAria")}>
          {status === "authenticated" && (
            <Suspense fallback={<SearchSuspense />}>
              <GlobalSearch />
            </Suspense>
          )}
          <div className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const hiddenForGuests =
                item.to === "/chat" && !can(user?.role ?? "guest", "chat");
              if (item.to !== "/" && status !== "authenticated") return null;
              if (status === "authenticated" && hiddenForGuests) return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-surface-2 text-foreground"
                        : "text-muted hover:bg-surface-2/70 hover:text-foreground",
                    )
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              );
            })}
            {status === "authenticated" &&
              can(user?.role ?? "guest", "manageMembers") && (
                <PendingApprovalsLink />
              )}
          </div>
          {status === "authenticated" && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t("account.openMenu")}
                className="rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Avatar src={user.avatarUrl} alt={user.name}>
                  {initials(user.name)}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs font-normal text-muted">
                      @{user.username}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/family">{t("account.family")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/photos">{t("nav.photos")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/events">{t("nav.events")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/announcements">
                    <Megaphone />
                    {t("nav.announcements")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/documents">
                    <FolderOpen />
                    {t("nav.documents")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/moments">
                    <Sparkles />
                    {t("nav.moments")}
                  </Link>
                </DropdownMenuItem>
                {can(user.role, "chat") && (
                  <DropdownMenuItem asChild>
                    <Link to="/chat">
                      <MessageCircle />
                      {t("nav.chat")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/members">{t("nav.members")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/me">
                    <UserRound />
                    {t("account.profile")}
                  </Link>
                </DropdownMenuItem>
                {can(user.role, "manageMembers") && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/approvals">
                      <ShieldCheck />
                      {t("account.approvals")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onLogout}>
                  <LogOut className="text-error" />
                  {t("account.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/login">
                <LogIn />
                {t("login.submit")}
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            aria-label={t("lang.switchTo")}
            title={t("lang.switchTo")}
            className="hidden items-center gap-1.5 sm:inline-flex"
          >
            <Languages className="size-4" />
            {t("lang.label")}
          </Button>
          <ThemeSwitcher />
          {status === "authenticated" && user && (
            <Suspense
              fallback={
                <span className="size-8 rounded-full bg-surface-2" aria-hidden />
              }
            >
              <NotificationBell />
            </Suspense>
          )}
        </nav>
      </div>
    </header>
  );
}
