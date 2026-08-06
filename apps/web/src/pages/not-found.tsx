import { Button } from "@family/ui";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-primary">404</p>
      <h1 className="font-display text-2xl font-semibold">
        This corner of the house is empty
      </h1>
      <p className="text-sm text-muted">
        The page you are looking for doesn’t exist or has moved.
      </p>
      <Button asChild className="mt-2">
        <Link to="/">
          <Home /> Back home
        </Link>
      </Button>
    </div>
  );
}
