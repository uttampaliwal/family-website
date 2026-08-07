import { z } from "zod";

/**
 * Role system — a single ordered hierarchy with capability thresholds.
 *
 * Higher roles inherit every capability of lower ones. Capabilities are
 * defined as the minimum role that may perform them, so adding a role only
 * requires placing it on the rank ladder.
 */
export const rolesSchema = z.enum([
  "owner",
  "admin",
  "parent",
  "adult",
  "teen",
  "child",
  "guest",
]);

export type Role = z.infer<typeof rolesSchema>;

/** All valid roles, ordered from most to least privileged. */
export const roleOptions: readonly Role[] = rolesSchema.options;

/** Numeric rank — higher wins.
 * guest=0 read-only, child/teen/adult escalate writes, parent+ family
 * management, admin/owner manage the member list itself.
 */
export const roleRanks: Record<Role, number> = {
  owner: 6,
  admin: 5,
  parent: 4,
  adult: 3,
  teen: 2,
  child: 1,
  guest: 0,
};

export type Capability =
  | "view" // read every family dataset + search
  | "chat" // send chat messages
  | "comment" // comment on moments
  | "createMoments" // publish moments / posts
  | "uploadPhotos"
  | "createEvents"
  | "uploadDocuments"
  | "createRooms" // create chat rooms (structure change)
  | "manageTree" // edit family-tree relationships
  | "moderate" // delete/edit any post, photo, event, document, comment
  | "publishAnnouncements"
  | "manageMembers" // approve / reject members, pending counts
  | "manageRoles" // change an account's role (hierarchy-bound)
  | "viewAudit"; // audit-log directory

/** Minimum role that grants each capability. */
export const MIN_ROLE_FOR_CAPABILITY: Record<Capability, Role> = {
  view: "guest",
  chat: "child",
  comment: "teen",
  createMoments: "teen",
  uploadPhotos: "teen",
  createEvents: "adult",
  uploadDocuments: "adult",
  createRooms: "adult",
  manageTree: "parent",
  moderate: "parent",
  publishAnnouncements: "admin",
  manageMembers: "admin",
  manageRoles: "admin",
  viewAudit: "admin",
};

export function can(role: Role, capability: Capability): boolean {
  return roleRanks[role] >= roleRanks[MIN_ROLE_FOR_CAPABILITY[capability]];
}

/**
 * Whether `actor` may assign the target role to an account that currently
 * holds `currentRole`. Everyone below owner is bound by rank: they may only
 * manage accounts strictly below their own tier (so an admin can review a
 * parent and promote a child, but can never touch another admin or an owner).
 */
export function canAssignRole(
  actor: Role,
  currentRole: Role,
  targetRole: Role,
): boolean {
  if (!can(actor, "manageRoles")) return false;
  if (actor === "owner") return true;
  return (
    roleRanks[targetRole] < roleRanks[actor] &&
    roleRanks[currentRole] < roleRanks[actor]
  );
}