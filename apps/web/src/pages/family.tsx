import { Badge, Button } from "@family/ui";
import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store.js";

export function FamilyPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Sprout className="size-7" />
        </span>
        <Badge variant="secondary">
          Signed in as {user?.name ?? user?.username}
        </Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          The family hub
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted sm:text-base">
          Members, the family tree, photos, and more are coming soon. This is
          where the nest gets built, room by room.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
