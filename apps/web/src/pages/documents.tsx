import type { Document } from "@family/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Skeleton, useToast } from "@family/ui";
import { ClipboardCopy, Download, FolderOpen, Link2Off, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store.js";
import { api, API_BASE } from "../lib/api-client.js";
import { useI18n } from "../i18n/index.js";
import { useSeo } from "../lib/seo.js";

interface DocumentListResponse {
  items: Document[];
  total: number;
}

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);
const MAX_SIZE = 25 * 1024 * 1024;

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/zip": "ZIP",
};

export function DocumentsPage() {
  const { t } = useI18n();
  useSeo("documents.heading");
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast().toast;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get<DocumentListResponse>("/documents"),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>(
        "/documents/upload-url",
        { name: file.name, mimeType: file.type, size: file.size },
      );

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      return api.post("/documents", {
        key,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        description: description.trim() || undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDescription("");
      toast("Document added to the nest", { variant: "success" });
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "Upload failed", { variant: "error" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast("Document deleted", { variant: "success" });
    },
    onError: () => toast("Couldn't delete the document", { variant: "error" }),
  });

  const share = useMutation({
    mutationFn: (id: string) => api.post<{ url: string }>(`/documents/${id}/share`),
    onSuccess: async (result) => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      await navigator.clipboard.writeText(`${window.location.origin}${result.url}`);
      toast("Share link copied to the clipboard", { variant: "success" });
    },
    onError: () => toast("Couldn't create a share link", { variant: "error" }),
  });

  const unshare = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}/share`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast("Share link revoked", { variant: "success" });
    },
    onError: () => toast("Couldn't revoke the share link", { variant: "error" }),
  });

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      toast("Use a PDF, text, Word, Excel, PowerPoint, or ZIP file", { variant: "error" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast("Documents can be at most 25 MB", { variant: "error" });
      return;
    }
    upload.mutate(file);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t("documents.heading")}</h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.total} document${data.total === 1 ? "" : "s"} in the archive` : "Papers, plans and keepsakes"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)…"
            className="w-52"
            aria-label="Document description"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={[...ALLOWED_TYPES].join(",")}
            className="hidden"
            onChange={onPickFile}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
            <Upload />
            {upload.isPending ? "Uploading…" : "Add document"}
          </Button>
        </div>
      </div>

      {isLoading && <DocumentsSkeleton />}
      {isError && (
        <p className="mt-8 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          Couldn't load the documents — please try again.
        </p>
      )}
      {data && data.items.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FolderOpen className="size-7" />
          </span>
          <p className="text-muted">{t("documents.empty")}</p>
        </div>
      )}
      {data && data.items.length > 0 && (
        <ul className="mt-8 space-y-3">
          {data.items.map((doc) => {
            const canManage = user?.role === "admin" || user?.id === doc.uploadedBy.id;
            return (
              <li
                key={doc.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FolderOpen className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{doc.name}</p>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                      {MIME_LABELS[doc.mimeType] ?? doc.mimeType} · {formatBytes(doc.size)}
                    </span>
                    {doc.shareUrl && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        SHARED
                      </span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="mt-0.5 truncate text-sm text-muted">{doc.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted">
                    <Link to={`/members/${doc.uploadedBy.id}`} className="hover:text-primary">
                      {doc.uploadedBy.name}
                    </Link>
                    {" · "}
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(doc.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    aria-label={`Download ${doc.name}`}
                  >
                    <a href={`${API_BASE}/documents/${doc.id}/download`}>
                      <Download />
                    </a>
                  </Button>
                  {canManage &&
                    (doc.shareUrl ? (
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Revoke share link for ${doc.name}`}
                        onClick={() => unshare.mutate(doc.id)}
                        disabled={unshare.isPending}
                        className="text-error hover:border-error/40 hover:bg-error/10"
                      >
                        <Link2Off />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Share ${doc.name}`}
                        onClick={() => share.mutate(doc.id)}
                        disabled={share.isPending}
                      >
                        <ClipboardCopy />
                      </Button>
                    ))}
                  {canManage && (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Delete ${doc.name}`}
                      onClick={() => remove.mutate(doc.id)}
                      disabled={remove.isPending}
                      className="text-error hover:border-error/40 hover:bg-error/10"
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DocumentsSkeleton() {
  return (
    <div className="mt-8 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
