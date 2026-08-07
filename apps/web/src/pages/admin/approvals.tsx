import type { AdminMember } from "@family/core";
import { can, roleOptions, type Role } from "@family/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Badge, Button, Card, CardContent, Skeleton, useToast } from "@family/ui";
import { Check, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../stores/auth-store.js";
import { api } from "../../lib/api-client.js";
import { useSeo } from "../../lib/seo.js";
import { roleLabelKey } from "../../components/role-badge.js";
import { useI18n } from "../../i18n/index.js";

interface AdminMemberListResponse {
  items: AdminMember[];
  total: number;
}

const SELECT_CLASS =
  "h-9 rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export function AdminApprovalsPage() {
  useSeo("account.approvals");
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const toast = useToast().toast;

  const canManage = can(user?.role ?? "guest", "manageMembers");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-members", "pending"],
    queryFn: () => api.get<AdminMemberListResponse>("/admin/members?status=pending&pageSize=50"),
    enabled: canManage,
  });

  const decide = useMutation({
    mutationFn: ({ id, status, role }: { id: string; status: "approved" | "rejected"; role: Role }) =>
      api.patch(`/admin/members/${id}`, { status, role: status === "approved" ? role : undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-count"] });
      toast("Review recorded", { variant: "success" });
    },
    onError: (error) =>
      toast(
        error instanceof Error ? error.message : "Couldn't update the member",
        { variant: "error" },
      ),
  });

  if (!canManage) {
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
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex justify-center overflow-hidden rounded-xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-8 w-8" strokeWidth={2.2} />
          </span>
          <p className="text-muted">All caught up — nothing waiting for approval.</p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {data?.items.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            decide={decide.mutate}
            isPending={decide.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function MemberRow({
  member,
  decide,
  isPending,
}: {
  member: AdminMember;
  decide: (input: { id: string; status: "approved" | "rejected"; role: Role }) => void;
  isPending: boolean;
}) {
  const { t } = useI18n();
  const [role, setRole] = useState<Role>("child");

  return (
    <Card>
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
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">{t("role.choose")}</span>
          <select
            className={SELECT_CLASS}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            aria-label={t("role.choose")}
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {t(roleLabelKey[option])}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => decide({ id: member.id, status: "approved", role })}
          >
            <Check />
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={isPending}
            onClick={() => decide({ id: member.id, status: "rejected", role })}
          >
            <X />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
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