import { cn } from "@family/ui";
import { HeartHandshake } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ThemeSwitcher } from "./theme-switcher.js";

const navItems = [{ to: "/", label: "Home" }];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            {navItems.map((item) => (
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
            ))}
          </div>
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
