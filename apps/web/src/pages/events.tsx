import type { Event } from "@family/core";
import { can } from "@family/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, Skeleton, Switch, Textarea, useToast } from "@family/ui";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store.js";
import { api } from "../lib/api-client.js";
import { useI18n } from "../i18n/index.js";
import { useSeo } from "../lib/seo.js";

interface EventListResponse {
  items: Event[];
  total: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPE_LABELS: Record<Event["type"], string> = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  gathering: "Gathering",
  ceremony: "Ceremony",
  other: "Other",
};

export function EventsPage() {
  const { t } = useI18n();
  useSeo("events.heading");
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast().toast;
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editing, setEditing] = useState<Event | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<Event["type"]>("gathering");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [yearly, setYearly] = useState(false);

  const { from, to } = useMemo(() => rangeFor(month), [month]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", from, to],
    queryFn: () =>
      api.get<EventListResponse>(`/events?from=${from.toISOString()}&to=${to.toISOString()}`),
  });

  const visible = useMemo(
    () => (data ? occurrencesIn(month, data.items) : []),
    [data, month],
  );

  const save = useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      editing
        ? api.patch(`/events/${editing.id}`, input)
        : api.post("/events", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      resetForm();
      toast(editing ? "Event updated" : "Event added to the calendar", { variant: "success" });
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "Couldn't save the event", { variant: "error" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      if (editing) resetForm();
      toast("Event deleted", { variant: "success" });
    },
    onError: () => toast("Couldn't delete the event", { variant: "error" }),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!date) {
      toast("Pick a date for the event", { variant: "error" });
      return;
    }
    const startsAt = new Date(`${date}T${time || "09:00"}:00`);
    save.mutate({
      title,
      type,
      startsAt: startsAt.toISOString(),
      description: description.trim() || undefined,
      recurrence: yearly ? "yearly" : "none",
    });
  }

  function startEdit(ev: Event) {
    setEditing(ev);
    setTitle(ev.title);
    setType(ev.type);
    setDate(toDateInput(ev.startsAt));
    setTime(toTimeInput(ev.startsAt));
    setDescription(ev.description ?? "");
    setYearly(ev.recurrence === "yearly");
  }

  function resetForm() {
    setEditing(null);
    setTitle("");
    setType("gathering");
    setDate("");
    setTime("");
    setDescription("");
    setYearly(false);
  }

  const cells = calendarCells(month);
  const dayEvents = selectedDay
    ? visible.filter(({ date: d }) => sameDay(d, selectedDay))
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("events.heading")}</h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.total} event${data.total === 1 ? "" : "s"} this month` : "Birthdays, anniversaries and gatherings"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" onClick={() => setMonth(startOfMonth(new Date()))} className="min-w-36">
            {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </Button>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-56 flex-1">
            <Label htmlFor="event-title">{editing ? "Edit event" : "New event"}</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grandma's birthday"
              required
            />
          </div>
          <div>
            <Label htmlFor="event-type">Type</Label>
            <select
              id="event-type"
              value={type}
              onChange={(e) => setType(e.target.value as Event["type"])}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="event-date">Date</Label>
            <Input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="event-time">Time</Label>
            <Input id="event-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="flex h-10 items-center gap-2">
            <Switch id="event-yearly" checked={yearly} onCheckedChange={setYearly} />
            <Label htmlFor="event-yearly" className="mb-0 text-sm">Repeats yearly</Label>
          </div>
          <Button type="submit" disabled={save.isPending} className="h-10">
            {editing ? <Pencil /> : <Plus />}
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Add event"}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={resetForm} className="h-10">
              Cancel
            </Button>
          )}
        </div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Details (optional)…"
          className="mt-4 max-w-xl"
          rows={2}
        />
      </form>

      {isLoading && <CalendarSkeleton />}
      {isError && (
        <p className="mt-8 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          Couldn't load the calendar — please try again.
        </p>
      )}

      {data && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="grid grid-cols-7 border-b border-border bg-surface-2/60">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-muted">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const events = visible.filter(({ date: d }) => sameDay(d, cell));
              const inMonth = cell.getMonth() === month.getMonth();
              const isSelected = selectedDay !== null && sameDay(cell, selectedDay);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : cell)}
                  aria-label={cell.toDateString()}
                  className={[
                    "flex min-h-20 flex-col items-stretch gap-1 p-1.5 text-left transition-colors",
                    "hover:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                    inMonth ? "bg-surface" : "bg-surface/50",
                    isSelected ? "ring-2 ring-inset ring-primary/60" : "border-b border-r border-border",
                  ].join(" ")}
                >
                  <span className={["text-xs font-medium", inMonth ? "text-foreground" : "text-muted/60"].join(" ")}>
                    {cell.getDate()}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {events.slice(0, 3).map(({ event }) => (
                      <span key={event.id} className={typeDot(event.type)} title={event.title} />
                    ))}
                  </span>
                  {events.length > 3 && (
                    <span className="text-[10px] font-medium text-muted">+{events.length - 3}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDay && (
        <section className="mt-8" aria-label={`Events on ${selectedDay.toDateString()}`}>
          <h2 className="font-display text-xl font-bold">
            {selectedDay.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          {dayEvents.length === 0 && (
            <p className="mt-2 text-sm text-muted">{t("events.openDay")}</p>
          )}
          <ul className="mt-3 space-y-3">
            {dayEvents.map(({ event }) => {
              const canManage = can(user?.role ?? "guest", "moderate") || user?.id === event.createdBy.id;
              return (
                <li
                  key={event.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
                >
                  <span className={typeDot(event.type, "size-3")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{event.title}</p>
                      <span className="text-xs font-medium text-muted">{TYPE_LABELS[event.type]}</span>
                      {event.recurrence === "yearly" && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          EVERY YEAR
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-0.5 text-sm text-muted">{event.description}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted">
                      <Link to={`/members/${event.createdBy.id}`} className="hover:text-primary">
                        {event.createdBy.name}
                      </Link>
                      {" · "}
                      {new Intl.DateTimeFormat(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(event.startsAt)}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1.5">
                      <Button variant="outline" size="icon" aria-label={`Edit ${event.title}`} onClick={() => startEdit(event)}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${event.title}`}
                        onClick={() => remove.mutate(event.id)}
                        disabled={remove.isPending}
                        className="text-error hover:border-error/40 hover:bg-error/10"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!selectedDay && data && data.total === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="size-7" />
          </span>
          <p className="text-muted">{t("events.emptyMonth")}</p>
        </div>
      )}
    </div>
  );
}

function typeDot(type: Event["type"], extra = "size-2"): string {
  const colors: Record<Event["type"], string> = {
    birthday: "bg-pink-500",
    anniversary: "bg-amber-500",
    gathering: "bg-sky-500",
    ceremony: "bg-emerald-500",
    other: "bg-slate-400",
  };
  return `inline-block rounded-full ${colors[type]} ${extra}`;
}

function CalendarSkeleton() {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <Skeleton className="h-10 w-full" />
      <div className="mt-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── date helpers ────────────────────────────────────────────────────

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function rangeFor(month: Date): { from: Date; to: Date } {
  const from = new Date(month);
  from.setHours(0, 0, 0, 0);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  to.setHours(23, 59, 59, 999);
  to.setDate(to.getDate() - 1);
  return { from, to };
}

/** 6 weeks of day cells starting on the Sunday on/before the 1st. */
function calendarCells(month: Date): Date[] {
  const start = new Date(month);
  start.setDate(1);
  start.setDate(1 - start.getDay());
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

interface Occurrence {
  event: Event;
  date: Date;
}

/** Maps events into the displayed month (yearly events move to their occurrence). */
function occurrencesIn(month: Date, items: Event[]): Occurrence[] {
  const out: Occurrence[] = [];
  for (const event of items) {
    const d = new Date(event.startsAt);
    if (event.recurrence === "yearly") {
      d.setFullYear(month.getFullYear());
      if (d.getMonth() !== month.getMonth()) continue;
    }
    out.push({ event, date: d });
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeInput(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}