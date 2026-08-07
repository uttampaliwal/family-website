import { type Role } from "@family/core";
import { Badge, type BadgeProps } from "@family/ui";
import { useI18n } from "../i18n/index.js";
import type { translations } from "../i18n/translations.js";

export type RoleTranslationKey = keyof typeof translations.en;

export const roleLabelKey: Record<Role, RoleTranslationKey> = {
  owner: "role.owner",
  admin: "role.admin",
  parent: "role.parent",
  adult: "role.adult",
  teen: "role.teen",
  child: "role.child",
  guest: "role.guest",
};

const roleVariant: Record<Role, NonNullable<BadgeProps["variant"]>> = {
  owner: "danger",
  admin: "warning",
  parent: "success",
  adult: "default",
  teen: "secondary",
  child: "secondary",
  guest: "outline",
};

/** Coloured pill showing a member's family role. */
export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const { t } = useI18n();
  return (
    <Badge variant={roleVariant[role]} className={className}>
      {t(roleLabelKey[role])}
    </Badge>
  );
}