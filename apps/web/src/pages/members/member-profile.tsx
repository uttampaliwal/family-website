import type { MemberPublic } from "@family/core";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Badge, Button, Card, CardContent, Skeleton } from "@family/ui";
import { CalendarDays, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api-client.js";

export function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["member", id],
    queryFn: () => api.get<{ member: MemberPublic }>(`/members/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading || !id) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="mx-auto size-24 rounded-full" />
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-muted">Member not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/members">Back to members</Link>
        </Button>
      </div>
    );
  }

  const member = data.member;
  const joined = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
  }).format(member.joinedAt);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <Avatar size="lg" className="size-24 text-2xl" src={member.avatarUrl}>
            {initials(member.name)}
          </Avatar>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{member.name}</h1>
            <p className="mt-1 text-sm text-muted">@{member.username}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {member.relationship && (
              <Badge variant="secondary" className="capitalize">
                {member.relationship.replaceAll("_", " ")}
              </Badge>
            )}
            <Badge className="capitalize">{member.gender.replaceAll("_", " ")}</Badge>
            {member.role === "admin" && <Badge variant="warning">Admin</Badge>}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays className="size-3.5" />
            Part of the nest since {joined}
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center">
        <Button asChild variant="outline">
          <Link to="/members">
            <UserRound />
            All members
          </Link>
        </Button>
      </div>
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
