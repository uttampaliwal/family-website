import type { AdminMember } from "@family/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Badge, Button, Card, CardContent, Skeleton, useToast } from "@family/ui";
import { Check, ShieldCheck, X } from "lucide-react";
import { useAuthStore } from "../../stores/auth-store.js";
import { api } from "../../lib/api-client.js";
import { useSeo } from "../../lib/seo.js";

interface AdminMemberListResponse {
  items: AdminMember[];
  total: number;
}

export function AdminApprovalsPage() {
  useSeo("account.approvals");
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast().toast;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-members", "pending"],
    queryFn: () => api.get<AdminMemberListResponse>("/admin/members?status=pending&pageSize=50"),
    enabled: user?.role === "admin",
  });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      api.patch(`/admin/members/${id}`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-count"] });
      toast("Review recorded", { variant: "success" });
    },
    onError: () => toast("Couldn't update the member", { variant: "error" }),
  });

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-muted">Admin access required to review new members.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Approval queue</h1>
      <p className="mt-1 text-sm text-muted">
        New members wait here until someone lets them in.
      </p>

      {isLoading && (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-success/10 text-success">
            <ShieldCheck className="size-7" />
          </span>
          <p className="text-muted">All caught up — nothing waiting for approval.</p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {data?.items.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <Avatar size="md">{initials(member.name)}</Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{member.name}</p>
                <p className="truncate text-sm text-muted">
                  {member.email} · @{member.username}
                </p>
                <p className="text-xs text-muted">
                  Signed up{" "}
                  {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                    member.createdAt,
                  )}
                  {!member.isVerified && (
                    <Badge variant="warning" className="ml-2">
                      Email not verified
                    </Badge>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: member.id, status: "approved" })}
                >
                  <Check />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: member.id, status: "rejected" })}
                >
                  <X />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
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
