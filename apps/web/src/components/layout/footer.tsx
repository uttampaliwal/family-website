import { HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          <HeartHandshake className="size-4 text-primary" />
          <span>
            Built with care for our family ·{" "}
            <span className="text-foreground">Kulaya</span>
          </span>
        </div>
        <nav
          className="flex items-center gap-5 text-sm text-muted"
          aria-label="Footer"
        >
          <Link
            to="/health"
            className="transition-colors hover:text-foreground"
          >
            Health
          </Link>
          <a href="#" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
