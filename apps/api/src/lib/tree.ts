import type { TreeResponse } from "@family/core";
import type { Types } from "mongoose";
import { AppError } from "../middleware/error.js";
import { User, type UserDocument } from "../models/user.js";

interface TreeDoc {
  _id: Types.ObjectId;
  name: string;
  username: string;
  gender: TreeResponse["members"][number]["gender"];
  relationship: TreeResponse["members"][number]["relationship"];
  role: TreeResponse["members"][number]["role"];
  parentIds: Types.ObjectId[];
}

/**
 * Builds the family tree over all approved members.
 *
 * - `roots` are members with no recorded parents.
 * - `generation` is the longest known parent chain (auto-derived from links).
 * - Cycles are prevented at write time and guarded defensively here.
 */
export async function buildTree(): Promise<TreeResponse> {
  const docs = (await User.find(
    { adminApprovalStatus: "approved" },
    { name: 1, username: 1, gender: 1, relationship: 1, role: 1, parentIds: 1 },
  ).lean()) as unknown as TreeDoc[];

  const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));

  const parentOf = new Map<string, string[]>();
  const childOf = new Map<string, string[]>();

  for (const doc of docs) {
    const id = doc._id.toString();
    const parents = (doc.parentIds ?? [])
      .map((p) => p.toString())
      .filter((p) => byId.has(p));
    parentOf.set(id, parents);
  }

  for (const [id, parents] of parentOf) {
    for (const parent of parents) {
      const siblings = childOf.get(parent) ?? [];
      siblings.push(id);
      childOf.set(parent, siblings);
    }
  }

  const generation = new Map<string, number>();
  const inProgress = new Set<string>();

  const depthOf = (id: string): number => {
    const cached = generation.get(id);
    if (cached !== undefined) return cached;
    if (inProgress.has(id)) return 0;

    inProgress.add(id);
    let depth = 0;
    for (const parent of parentOf.get(id) ?? []) {
      depth = Math.max(depth, depthOf(parent) + 1);
    }
    inProgress.delete(id);
    generation.set(id, depth);
    return depth;
  };

  for (const id of byId.keys()) depthOf(id);

  const members = [...docs]
    .map((doc) => {
      const id = doc._id.toString();
      return {
        id,
        name: doc.name,
        username: doc.username,
        gender: doc.gender,
        relationship: doc.relationship,
        role: doc.role,
        avatarUrl: null,
        generation: generation.get(id) ?? 0,
        parentIds: parentOf.get(id) ?? [],
        childrenIds: childOf.get(id) ?? [],
      };
    })
    .sort((a, b) => a.generation - b.generation || a.name.localeCompare(b.name));

  const roots = members.filter((m) => m.generation === 0).map((m) => m.id);

  return { roots, members };
}

/**
 * Validate a new parent set for `member`. Rejects self-references, unknown or
 * non-approved parents, duplicates, and anything that would create a cycle.
 */
export async function assertValidParents(
  member: UserDocument,
  parentIds: string[],
): Promise<void> {
  const unique = [...new Set(parentIds)];
  const memberId = member._id.toString();

  if (unique.some((id) => id === memberId)) {
    throw new AppError(400, "INVALID_RELATIONSHIP", "A member can't be their own parent");
  }

  const parents = await User.find(
    { _id: { $in: unique }, adminApprovalStatus: "approved" },
    { parentIds: 1 },
  );
  if (parents.length !== unique.length) {
    throw new AppError(
      400,
      "INVALID_RELATIONSHIP",
      "Every parent must be an existing, approved member",
    );
  }

  const queue = [...parents.flatMap((p) => p.parentIds.map((id) => id.toString()))];
  const visited = new Set<string>([memberId]);

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (id === memberId) {
      throw new AppError(400, "INVALID_RELATIONSHIP", "That link would create a cycle");
    }
    if (visited.has(id)) continue;
    visited.add(id);

    const ancestor = await User.findById(id, { parentIds: 1 });
    if (ancestor) queue.push(...ancestor.parentIds.map((p) => p.toString()));
  }
}