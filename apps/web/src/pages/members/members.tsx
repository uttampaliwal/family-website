import type { MemberPublic } from "@family/core";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Badge, Button, Card, CardContent, Input } from "@family/ui";
import { Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api-client.js";
import { useSeo } from "../../lib/seo.js";

interface MemberListResponse {
  items: MemberPublic[];
  total: number;
}

export function MembersPage() {
  useSeo("nav.members");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["members", debounced],
    queryFn: () => {
      const q = debounced ? `?search=${encodeURIComponent(debounced)}&pageSize=48` : "?pageSize=48";
      return api.get<MemberListResponse>(`/members${q}`);
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Family members</h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.total} member${data.total === 1 ? "" : "s"} in the nest` : "The people of our nest"}
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-64 pl-10"
            aria-label="Search members"
          />
        </div>
      </div>

      {isLoading && <MemberGridSkeleton />}
      {isError && (
        <p className="mt-8 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          Couldn't load members — please try again.
        </p>
      )}
      {data && data.items.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-7" />
          </span>
          <p className="text-muted">No members match that search.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member }: { member: MemberPublic }) {
  return (
    <Card className="transition-transform duration-200 hover:-translate-y-1">
      <CardContent className="flex items-center gap-4 p-5">
        <Avatar size="lg" src={member.avatarUrl}>
          {initials(member.name)}
        </Avatar>
        <div className="min-w-0 flex-1">
          <Link
            to={`/members/${member.id}`}
            className="block truncate font-semibold text-foreground hover:text-primary"
          >
            {member.name}
          </Link>
          <p className="truncate text-sm text-muted">@{member.username}</p>
          <div className="mt-1.5 flex gap-1.5">
            {member.relationship && (
              <Badge variant="secondary" className="capitalize">
                {member.relationship.replaceAll("_", " ")}
              </Badge>
            )}
            {member.role === "admin" && <Badge variant="warning">Admin</Badge>}
          </div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/members/${member.id}`}>View</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function MemberGridSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="size-16 animate-pulse rounded-full bg-surface-2" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
            </div>
          </CardContent>
        </Card>
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
