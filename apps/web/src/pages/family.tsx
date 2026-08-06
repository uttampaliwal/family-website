import type { TreeResponse } from "@family/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Badge, Button, Card, CardContent, Skeleton, useToast } from "@family/ui";
import { TreePine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store.js";
import { api } from "../lib/api-client.js";
import { useSeo } from "../lib/seo.js";

export function FamilyPage() {
  const user = useAuthStore((s) => s.user);

  useSeo("account.family");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["family-tree"],
    queryFn: () => api.get<TreeResponse>("/members/tree"),
  });

  const columns = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, typeof data.members>();
    for (const member of data.members) {
      const column = map.get(member.generation) ?? [];
      column.push(member);
      map.set(member.generation, column);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Family tree</h1>
          <p className="mt-1 text-sm text-muted">
            {data
              ? `${data.members.length} member${data.members.length === 1 ? "" : "s"} · oldest generation first`
              : "Generations of our nest"}
          </p>
        </div>
      </div>

      {user?.role === "admin" && <RelationshipEditor />}

      {isLoading && <TreeSkeleton />}
      {isError && (
        <p className="mt-8 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          Couldn't load the family tree — please try again.
        </p>
      )}
      {data && data.members.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <TreePine className="size-7" />
          </span>
          <p className="text-muted">The tree is still a seed — no members yet.</p>
        </div>
      )}
      {data && data.members.length > 0 && (
        <div className="mt-8 overflow-x-auto pb-4">
          <div className="flex min-w-max items-start gap-6">
            {columns.map(([generation, members]) => (
              <div key={generation} className="w-64 shrink-0">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-px flex-1 bg-border" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {generationLabel(generation)}
                  </p>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-3">
                  {members.map((member) => (
                    <TreeCard
                      key={member.id}
                      member={member}
                      parentNames={member.parentIds
                        .map((id) => data.members.find((m) => m.id === id)?.name)
                        .filter(Boolean)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TreeCard({
  member,
  parentNames,
}: {
  member: TreeResponse["members"][number];
  parentNames: (string | undefined)[];
}) {
  return (
    <Card className="transition-transform duration-200 hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar size="md" src={member.avatarUrl}>
            {initials(member.name)}
          </Avatar>
          <div className="min-w-0 flex-1">
            <Link
              to={`/members/${member.id}`}
              className="block truncate font-semibold text-foreground hover:text-primary"
            >
              {member.name}
            </Link>
            <p className="truncate text-xs text-muted">@{member.username}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {member.relationship && (
            <Badge variant="secondary" className="capitalize">
              {member.relationship.replaceAll("_", " ")}
            </Badge>
          )}
          {member.role === "admin" && <Badge variant="warning">Admin</Badge>}
        </div>
        {parentNames.length > 0 && (
          <p className="mt-3 truncate text-xs text-muted">
            Child of {parentNames.join(" & ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RelationshipEditor() {
  const queryClient = useQueryClient();
  const toast = useToast().toast;

  const { data } = useQuery({
    queryKey: ["family-tree"],
    queryFn: () => api.get<TreeResponse>("/members/tree"),
  });

  const [memberId, setMemberId] = useState("");
  const [parentA, setParentA] = useState("");
  const [parentB, setParentB] = useState("");

  const member = data?.members.find((m) => m.id === memberId);

  useEffect(() => {
    if (!member) {
      setParentA("");
      setParentB("");
      return;
    }
    setParentA(member.parentIds[0] ?? "");
    setParentB(member.parentIds[1] ?? "");
  }, [member]);

  const link = useMutation({
    mutationFn: (parentIds: string[]) =>
      api.patch(`/admin/members/${memberId}/relationships`, { parentIds }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["family-tree"] });
      toast("Relationship saved", { variant: "success" });
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : "Couldn't save the relationship", {
        variant: "error",
      });
    },
  });

  if (!data || data.members.length === 0) return null;

  const options = data.members
    .filter((m) => m.id !== memberId)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Card className="mt-6">
      <CardContent className="p-5">
        <p className="font-semibold">Link parents</p>
        <p className="mt-0.5 text-xs text-muted">
          Pick a member, then choose up to two parents to build the tree.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Member</span>
            <select
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              <option value="">Select a member…</option>
              {data.members
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Parent 1</span>
            <select
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              value={parentA}
              onChange={(e) => setParentA(e.target.value)}
              disabled={!member}
            >
              <option value="">None</option>
              {options.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Parent 2</span>
            <select
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              value={parentB}
              onChange={(e) => setParentB(e.target.value)}
              disabled={!member}
            >
              <option value="">None</option>
              {options.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {member && (
          <p className="mt-3 text-xs text-muted">
            {member.parentIds.length > 0
              ? `Currently linked to: ${member.parentIds
                  .map((id) => data.members.find((m) => m.id === id)?.name ?? "unknown")
                  .join(" & ")}`
              : "Not linked to anyone yet."}
          </p>
        )}
        <Button
          className="mt-4"
          size="sm"
          disabled={!member || link.isPending}
          onClick={() => link.mutate([parentA, parentB].filter(Boolean))}
        >
          Save relationship
        </Button>
      </CardContent>
    </Card>
  );
}

function TreeSkeleton() {
  return (
    <div className="mt-8 flex gap-6 overflow-x-auto">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="w-64 shrink-0 space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

function generationLabel(generation: number): string {
  if (generation === 0) return "Elders";
  const ordinal =
    generation === 1 ? "2nd" : generation === 2 ? "3rd" : generation === 3 ? "4th" : `${generation + 1}th`;
  return `${ordinal} generation`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
