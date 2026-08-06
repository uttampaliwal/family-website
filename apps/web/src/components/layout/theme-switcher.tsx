import type { ThemeId } from "@family/core";
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useTheme,
} from "@family/ui";
import { Moon, Palette, Sparkles, Sun, Trees } from "lucide-react";

const themeOptions: { id: ThemeId; label: string; icon: typeof Sparkles }[] = [
  { id: "warm", label: "Warm & Elegant", icon: Trees },
  { id: "minimal", label: "Minimal", icon: Sparkles },
  { id: "playful", label: "Playful", icon: Palette },
];

export function ThemeSwitcher() {
  const { theme, mode, setTheme, toggleMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Customize appearance"
        className="grid size-10 place-items-center rounded-lg text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {mode === "light" ? (
          <Sun className="size-5" />
        ) : (
          <Moon className="size-5" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>

        <div className="grid grid-cols-3 gap-1.5 px-1.5 pb-1.5">
          {themeOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-[11px] font-medium transition-colors",
                theme === id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted hover:bg-surface-2",
              )}
            >
              <Icon className="size-4" />
              <span>{label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => toggleMode()}>
          {mode === "light" ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
          Switch to {mode === "light" ? "dark" : "light"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
