import type { Post } from "@family/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Skeleton, Textarea, useToast } from "@family/ui";
import { Heart, MessageCircle, Send, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store.js";
import { api } from "../lib/api-client.js";

interface PostListResponse {
  items: Post[];
  total: number;
}

export function MomentsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast().toast;

  const [draft, setDraft] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts"],
    queryFn: () => api.get<PostListResponse>("/posts"),
  });

  const createPost = useMutation({
    mutationFn: (body: string) => api.post("/posts", { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      setDraft("");
      toast("Shared with the family", { variant: "success" });
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "Couldn't post", { variant: "error" });
    },
  });

  const toggleLike = useMutation({
    mutationFn: (id: string) => api.post(`/posts/${id}/like`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["posts"] }),
    onError: () => toast("Couldn't update the like", { variant: "error" }),
  });

  const removePost = useMutation({
    mutationFn: (id: string) => api.delete(`/posts/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast("Post removed", { variant: "success" });
    },
    onError: () => toast("Couldn't delete the post", { variant: "error" }),
  });

  const addComment = useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) =>
      api.post(`/posts/${postId}/comments`, { body }),
    onSuccess: (_result, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      setCommentDrafts((d) => ({ ...d, [postId]: "" }));
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "Couldn't comment", { variant: "error" });
    },
  });

  const removeComment = useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      api.delete(`/posts/${postId}/comments/${commentId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["posts"] }),
    onError: () => toast("Couldn't delete the comment", { variant: "error" }),
  });

  function toggleComments(postId: string) {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  function submitComment(postId: string) {
    const body = (commentDrafts[postId] ?? "").trim();
    if (!body) return;
    addComment.mutate({ postId, body });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Moments</h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.total} moment${data.total === 1 ? "" : "s"} shared with the family` : "The little things, together"}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) createPost.mutate(draft.trim());
        }}
        className="mt-8 rounded-2xl border border-border bg-surface p-4 shadow-sm"
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share a moment with the family…"
          rows={3}
          className="border-none bg-transparent px-0 focus-visible:ring-0"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-muted">{draft.length}/2000</span>
          <Button type="submit" disabled={createPost.isPending || !draft.trim()} size="sm">
            <Send />
            {createPost.isPending ? "Posting…" : "Share"}
          </Button>
        </div>
      </form>

      {isLoading && <MomentsSkeleton />}
      {isError && (
        <p className="mt-8 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          Couldn't load the feed — please try again.
        </p>
      )}

      {data && data.items.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-7" />
          </span>
          <p className="text-muted">No moments yet — share the first one above!</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <ul className="mt-8 space-y-4">
          {data.items.map((post) => {
            const canManagePost = user?.role === "admin" || user?.id === post.createdBy.id;
            return (
              <li key={post.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar size="sm" src={null}>{initials(post.createdBy.name)}</Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <Link to={`/members/${post.createdBy.id}`} className="font-semibold hover:text-primary">
                        {post.createdBy.name}
                      </Link>
                      <span className="text-xs text-muted">
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(post.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>

                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike.mutate(post.id)}
                        disabled={toggleLike.isPending}
                        className={post.likedByMe ? "text-error" : "text-muted"}
                      >
                        <Heart className={post.likedByMe ? "fill-current" : undefined} />
                        {post.likeCount}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(post.id)}
                        className="text-muted"
                      >
                        <MessageCircle />
                        {post.comments.length}
                      </Button>
                      {canManagePost && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete post"
                          onClick={() => removePost.mutate(post.id)}
                          disabled={removePost.isPending}
                          className="ml-auto text-error"
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>

                    {openComments.has(post.id) && (
                      <div className="mt-3 space-y-3 border-t border-border pt-3">
                        <ul className="space-y-2">
                          {post.comments.map((comment) => {
                            const canManageComment =
                              user?.role === "admin" || user?.id === comment.createdBy.id;
                            return (
                              <li key={comment.id} className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs">
                                    <Link to={`/members/${comment.createdBy.id}`} className="font-semibold hover:text-primary">
                                      {comment.createdBy.name}
                                    </Link>
                                    <span className="text-muted">
                                      {" "}·{" "}
                                      {new Intl.DateTimeFormat(undefined, {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      }).format(comment.createdAt)}
                                    </span>
                                  </p>
                                  <p className="text-sm">{comment.body}</p>
                                </div>
                                {canManageComment && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 shrink-0 text-error"
                                    aria-label="Delete comment"
                                    onClick={() => removeComment.mutate({ postId: post.id, commentId: comment.id })}
                                    disabled={removeComment.isPending}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            submitComment(post.id);
                          }}
                        >
                          <input
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(e) =>
                              setCommentDrafts((d) => ({ ...d, [post.id]: e.target.value }))
                            }
                            placeholder="Add a comment…"
                            className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={addComment.isPending || !(commentDrafts[post.id] ?? "").trim()}
                          >
                            Post
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MomentsSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-2xl" />
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
