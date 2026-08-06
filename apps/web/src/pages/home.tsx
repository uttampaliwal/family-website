import type { ThemeId } from "@family/core";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  useTheme,
} from "@family/ui";
import {
  ArrowRight,
  CalendarDays,
  FolderLock,
  Image,
  MessageCircleHeart,
  PartyPopper,
  Sprout,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store.js";

const features = [
  {
    icon: Image,
    title: "Photo Albums",
    description:
      "Preserve every celebration — share albums with the whole family.",
  },
  {
    icon: PartyPopper,
    title: "Events & RSVP",
    description: "Birthdays, weddings, and get-togethers, all in one calendar.",
  },
  {
    icon: FolderLock,
    title: "Documents",
    description:
      "Important papers kept safe, privately, and always within reach.",
  },
  {
    icon: Sprout,
    title: "Family Tree",
    description: "Watch the branches of our family grow through generations.",
  },
  {
    icon: MessageCircleHeart,
    title: "Moments",
    description: "A private feed where every day can be shared with everyone.",
  },
  {
    icon: Users,
    title: "Announcements",
    description: "One trusted place for news that matters to the whole family.",
  },
];

export function HomePage() {
  const { theme, mode, toggleMode } = useTheme();
  const { user, status } = useAuthStore();
  const [preview, setPreview] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <Badge variant="secondary" className="gap-2">
          <CalendarDays className="size-3.5" />
          Kulaya — our family nest is coming home
        </Badge>
        <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Where our family stays
          <span className="text-primary"> close</span>, no matter the miles
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Kulaya — कुल + आलय, the family nest. A private home for photos, events,
          documents, and the moments in between — built for every generation, in
          every mood.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {status === "authenticated" && user ? (
            <Button asChild size="lg">
              <Link to="/family">
                Welcome back, {user.name.split(" ")[0]}! <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to="/login">
                Join the family <ArrowRight />
              </Link>
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={toggleMode}>
            Try {mode === "light" ? "dark" : "light"} mode
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Currently on the “{theme}” theme · light mode
        </p>
      </section>

      {/* Theme showcase */}
      <section className="pb-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Made for every generation
            </h2>
            <p className="text-sm text-muted">
              Three themes, light and dark — choose what feels like home.
            </p>
          </div>
          <label className="flex items-center gap-2.5 text-sm font-medium">
            Preview dark mode
            <Switch checked={preview} onCheckedChange={setPreview} />
          </label>
        </div>

        <Tabs defaultValue="warm">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="warm">Warm &amp; Elegant</TabsTrigger>
            <TabsTrigger value="minimal">Minimal</TabsTrigger>
            <TabsTrigger value="playful">Playful</TabsTrigger>
          </TabsList>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(["warm", "minimal", "playful"] as ThemeId[]).map((t) => (
              <PreviewCard key={t} themeId={t} forceDark={preview} />
            ))}
          </div>
        </Tabs>
      </section>

      {/* Feature grid */}
      <section className="pb-20">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-semibold">
            Everything a family needs
          </h2>
          <p className="mt-1 text-sm text-muted">
            Arriving step by step, built on solid ground.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="transition-transform duration-200 hover:-translate-y-1"
            >
              <CardHeader>
                <span className="mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function PreviewCard({
  themeId,
  forceDark,
}: {
  themeId: ThemeId;
  forceDark: boolean;
}) {
  const { theme, mode, setTheme } = useTheme();
  const isActive = theme === themeId;
  const displayMode = forceDark ? "dark" : mode;

  return (
    <button
      onClick={() => setTheme(themeId)}
      data-theme={themeId}
      data-mode={displayMode}
      className={`group rounded-2xl border p-4 text-left transition-all ${
        isActive
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="pointer-events-none space-y-3 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-fg">
              <Sprout className="size-3.5" />
            </span>
            <span className="text-sm font-semibold">Preview</span>
          </div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {themeId}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 w-3/4 rounded-full bg-surface-2" />
          <div className="h-2.5 w-1/2 rounded-full bg-surface-2" />
        </div>
        <div className="flex gap-1.5">
          <span className="h-6 w-16 rounded-md bg-primary" />
          <span className="h-6 w-16 rounded-md border border-border" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-sm font-medium capitalize">{themeId}</span>
        {isActive && <Badge variant="success">Active</Badge>}
      </div>
    </button>
  );
}
