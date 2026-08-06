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
import { FolderOpen, HeartHandshake, LogIn, LogOut, Megaphone, MessageCircle, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/auth-store.js";
import { api } from "../../lib/api-client.js";
import { ThemeSwitcher } from "./theme-switcher.js";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/members", label: "Members" },
  { to: "/photos", label: "Photos" },
  { to: "/events", label: "Events" },
  { to: "/announcements", label: "Announcements" },
  { to: "/documents", label: "Documents" },
  { to: "/moments", label: "Moments" },
  { to: "/chat", label: "Chat" },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PendingApprovalsLink() {
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
      Approvals
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

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          <div className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) =>
              item.to !== "/" && status !== "authenticated" ? null : (
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
                  {item.label}
                </NavLink>
              ),
            )}
            {status === "authenticated" && user?.role === "admin" && (
              <PendingApprovalsLink />
            )}
          </div>
          {status === "authenticated" && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
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
                  <Link to="/family">Family hub</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/photos">Photos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/events">Events</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/announcements">
                    <Megaphone />
                    Announcements
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/documents">
                    <FolderOpen />
                    Documents
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/moments">
                    <Sparkles />
                    Moments
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chat">
                    <MessageCircle />
                    Chat
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/members">Members</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/me">
                    <UserRound />
                    My profile
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/approvals">
                      <ShieldCheck />
                      Approval queue
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onLogout}>
                  <LogOut className="text-error" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/login">
                <LogIn />
                Sign in
              </Link>
            </Button>
          )}
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
