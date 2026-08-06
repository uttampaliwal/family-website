import type { Announcement } from "@family/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, Skeleton, Textarea, useToast } from "@family/ui";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store.js";
import { api } from "../lib/api-client.js";
import { useI18n } from "../i18n/index.js";
import { useSeo } from "../lib/seo.js";

interface AnnouncementListResponse {
  items: Announcement[];
  total: number;
}

export function AnnouncementsPage() {
  const { t } = useI18n();
  useSeo("announcements.heading");
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast().toast;
  const isAdmin = user?.role === "admin";

  const [editing, setEditing] = useState<Announcement | null>(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get<AnnouncementListResponse>("/announcements"),
  });

  const save = useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      editing
        ? api.patch(`/announcements/${editing.id}`, input)
        : api.post("/announcements", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      resetForm();
      toast(editing ? "Announcement updated" : "Announcement published — members were emailed", { variant: "success" });
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "Couldn't save the announcement", { variant: "error" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      if (editing) resetForm();
      toast("Announcement deleted", { variant: "success" });
    },
    onError: () => toast("Couldn't delete the announcement", { variant: "error" }),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate({ title: title.trim(), body: body.trim() });
  }

  function startEdit(announcement: Announcement) {
    setComposing(false);
    setEditing(announcement);
    setTitle(announcement.title);
    setBody(announcement.body);
  }

  function resetForm() {
    setComposing(false);
    setEditing(null);
    setTitle("");
    setBody("");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("announcements.heading")}</h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.total} announcement${data.total === 1 ? "" : "s"} from the family` : "Family news, notices and wishes"}
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setComposing(true)} className={composing || editing ? "hidden" : undefined}>
            <Plus />
            New announcement
          </Button>
        )}
      </div>

      {isAdmin && composing && !editing && (
        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-56 flex-1">
              <Label htmlFor="announcement-title">New announcement</Label>
              <Input
                id="announcement-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Diwali get-together"
                required
              />
            </div>
            <Button type="submit" disabled={save.isPending} className="h-10">
              <Plus />
              {save.isPending ? "Publishing…" : "Publish"}
            </Button>
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What should the family know?…"
            className="mt-4"
            rows={3}
            required
          />
        </form>
      )}

      {isAdmin && editing && (
        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl border border-primary/30 bg-surface p-5 shadow-sm"
        >
          <Label htmlFor="announcement-edit-title">Edit announcement</Label>
          <Input
            id="announcement-edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-2"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-4"
            rows={4}
            required
          />
          <div className="mt-4 flex items-center gap-2">
            <Button type="submit" disabled={save.isPending} className="h-10">
              <Pencil />
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} className="h-10">
              Cancel
            </Button>
          </div>
        </form>
      )}

      {isLoading && <AnnouncementsSkeleton />}
      {isError && (
        <p className="mt-8 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          Couldn't load the announcements — please try again.
        </p>
      )}

      {data && data.total > 0 && (
        <ul className="mt-8 space-y-4">
          {data.items.map((announcement) => (
            <li
              key={announcement.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-bold">{announcement.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{announcement.body}</p>
                  <p className="mt-3 text-xs text-muted">
                    <Link to={`/members/${announcement.createdBy.id}`} className="hover:text-primary">
                      {announcement.createdBy.name}
                    </Link>
                    {" · "}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "long",
                      timeStyle: "short",
                    }).format(announcement.createdAt)}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Edit ${announcement.title}`}
                      onClick={() => startEdit(announcement)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Delete ${announcement.title}`}
                      onClick={() => remove.mutate(announcement.id)}
                      disabled={remove.isPending}
                      className="text-error hover:border-error/40 hover:bg-error/10"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && data.total === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Megaphone className="size-7" />
          </span>
          <p className="text-muted">
            {t("announcements.empty", { action: t(isAdmin ? "announcements.empty.admin" : "announcements.empty.soon") })}
          </p>
        </div>
      )}
    </div>
  );
}

function AnnouncementsSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}
