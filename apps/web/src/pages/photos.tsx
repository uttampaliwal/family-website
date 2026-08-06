import type { Photo } from "@family/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Input, Skeleton, useToast } from "@family/ui";
import { ImagePlus, Images, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store.js";
import { api } from "../lib/api-client.js";
import { useI18n } from "../i18n/index.js";
import { useSeo } from "../lib/seo.js";

interface PhotoListResponse {
  items: Photo[];
  total: number;
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic"]);
const MAX_SIZE = 20 * 1024 * 1024;

export function PhotosPage() {
  const { t } = useI18n();
  useSeo("photos.heading");
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast().toast;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["photos"],
    queryFn: () => api.get<PhotoListResponse>("/photos"),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>(
        "/photos/upload-url",
        { mimeType: file.type, size: file.size },
      );

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      return api.post("/photos", {
        key,
        mimeType: file.type,
        size: file.size,
        caption: caption.trim() || undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["photos"] });
      setCaption("");
      toast("Photo added to the nest", { variant: "success" });
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "Upload failed", { variant: "error" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/photos/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["photos"] });
      toast("Photo deleted", { variant: "success" });
    },
    onError: () => toast("Couldn't delete the photo", { variant: "error" }),
  });

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      toast("Use a JPG, PNG, WebP, GIF, AVIF, or HEIC image", { variant: "error" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast("Photos can be at most 20 MB", { variant: "error" });
      return;
    }
    upload.mutate(file);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("photos.heading")}</h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.total} photo${data.total === 1 ? "" : "s"} in the album` : "Moments of our nest"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)…"
            className="w-48"
            aria-label="Photo caption"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic"
            className="hidden"
            onChange={onPickFile}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
            <ImagePlus />
            {upload.isPending ? "Uploading…" : "Add photo"}
          </Button>
        </div>
      </div>

      {isLoading && <PhotoGridSkeleton />}
      {isError && (
        <p className="mt-8 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          Couldn't load the photos — please try again.
        </p>
      )}
      {data && data.items.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Images className="size-7" />
          </span>
          <p className="text-muted">{t("photos.empty")}</p>
        </div>
      )}
      {data && data.items.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.items.map((photo) => {
            const canDelete = user?.role === "admin" || user?.id === photo.uploadedBy.id;
            return (
              <figure
                key={photo.id}
                className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-2">
                  <img
                    src={photo.url}
                    alt={photo.caption ?? `Photo by ${photo.uploadedBy.name}`}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {canDelete && (
                    <button
                      type="button"
                      aria-label={`Delete photo by ${photo.uploadedBy.name}`}
                      onClick={() => remove.mutate(photo.id)}
                      disabled={remove.isPending}
                      className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/80 text-error opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-0"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <figcaption className="flex items-center gap-2.5 p-3">
                  <Avatar size="sm" src={null}>
                    {initials(photo.uploadedBy.name)}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    {photo.caption && (
                      <p className="truncate text-sm font-medium">{photo.caption}</p>
                    )}
                    <p className="truncate text-xs text-muted">
                      <Link
                        to={`/members/${photo.uploadedBy.id}`}
                        className="hover:text-primary"
                      >
                        {photo.uploadedBy.name}
                      </Link>
                      {" · "}
                      {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                        photo.createdAt,
                      )}
                    </p>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PhotoGridSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
      ))}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
