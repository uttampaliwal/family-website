import type { Document, Photo } from "@family/core";
import { Button, Skeleton, useToast } from "@family/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveRestore,
  FileText,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api-client.js";
import { useSeo } from "../lib/seo.js";

interface TrashList<T> {
  items: T[];
  total: number;
}

export function TrashPage() {
  useSeo("trash.heading");
  const queryClient = useQueryClient();
  const toast = useToast().toast;

  const photosQuery = useQuery({
    queryKey: ["trash-photos"],
    queryFn: () => api.get<TrashList<Photo>>("/photos/trash"),
  });
  const documentsQuery = useQuery({
    queryKey: ["trash-documents"],
    queryFn: () => api.get<TrashList<Document>>("/documents/trash"),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["trash-photos"] });
    void queryClient.invalidateQueries({ queryKey: ["trash-documents"] });
    void queryClient.invalidateQueries({ queryKey: ["photos"] });
    void queryClient.invalidateQueries({ queryKey: ["documents"] });
  }

  const restorePhoto = useMutation({
    mutationFn: (id: string) => api.post(`/photos/${id}/restore`),
    onSuccess: () => {
      invalidate();
      toast("Photo restored", { variant: "success" });
    },
    onError: () => toast("Couldn't restore the photo", { variant: "error" }),
  });
  const purgePhoto = useMutation({
    mutationFn: (id: string) => api.delete(`/photos/${id}/permanent`),
    onSuccess: () => {
      invalidate();
      toast("Photo permanently deleted", { variant: "success" });
    },
    onError: () => toast("Couldn't delete the photo", { variant: "error" }),
  });
  const restoreDocument = useMutation({
    mutationFn: (id: string) => api.post(`/documents/${id}/restore`),
    onSuccess: () => {
      invalidate();
      toast("Document restored", { variant: "success" });
    },
    onError: () => toast("Couldn't restore the document", { variant: "error" }),
  });
  const purgeDocument = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}/permanent`),
    onSuccess: () => {
      invalidate();
      toast("Document permanently deleted", { variant: "success" });
    },
    onError: () => toast("Couldn't delete the document", { variant: "error" }),
  });

  function confirmPurge(kind: "photo" | "document", id: string, name: string) {
    if (
      window.confirm(
        `Permanently delete "${name}"?\n\nThis cannot be undone — the file and its record are gone forever.`,
      )
    ) {
      if (kind === "photo") purgePhoto.mutate(id);
      else purgeDocument.mutate(id);
    }
  }

  const loading = photosQuery.isLoading || documentsQuery.isLoading;
  const isError = photosQuery.isError || documentsQuery.isError;
  const photos = photosQuery.data?.items ?? [];
  const documents = documentsQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Trash</h1>
      <p className="mt-1 text-sm text-muted">
        Deleted photos and documents stay here for 30 days, then are purged
        automatically.{" "}
        <Link to="/photos" className="hover:text-primary">
          Back to photos
        </Link>
      </p>

      {loading && (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
      {isError && (
        <p className="mt-8 text-sm text-error">
          Couldn't load the Trash. Try again.
        </p>
      )}

      {!loading &&
        !isError &&
        photos.length === 0 &&
        documents.length === 0 && (
          <p className="mt-8 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
            Trash is empty — nothing to recover.
          </p>
        )}

      {photos.length > 0 && (
        <section className="mt-8" aria-label="Trashed photos">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ImageIcon className="size-5" /> Photos ({photos.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {photos.map((photo) => (
              <li
                key={photo.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {photo.caption ?? "Untitled photo"}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Restore ${photo.caption ?? "photo"}`}
                  onClick={() => restorePhoto.mutate(photo.id)}
                  disabled={restorePhoto.isPending}
                >
                  <ArchiveRestore />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Delete ${photo.caption ?? "photo"} forever`}
                  onClick={() =>
                    confirmPurge(
                      "photo",
                      photo.id,
                      photo.caption ?? "Untitled photo",
                    )
                  }
                  disabled={purgePhoto.isPending}
                  className="text-error hover:border-error/40 hover:bg-error/10"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {documents.length > 0 && (
        <section className="mt-8" aria-label="Trashed documents">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="size-5" /> Documents ({documents.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {doc.name}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Restore ${doc.name}`}
                  onClick={() => restoreDocument.mutate(doc.id)}
                  disabled={restoreDocument.isPending}
                >
                  <ArchiveRestore />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Delete ${doc.name} forever`}
                  onClick={() => confirmPurge("document", doc.id, doc.name)}
                  disabled={purgeDocument.isPending}
                  className="text-error hover:border-error/40 hover:bg-error/10"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
