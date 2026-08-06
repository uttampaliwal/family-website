import { Button } from "@family/ui";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/api-client.js";
import { AuthCard } from "../../components/auth/auth-card.js";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

type State = "verifying" | "error" | "success";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>("verifying");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.post("/auth/verify-email", { token });
        if (!cancelled) setState("success");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthCard
      title="Verifying your email"
      description={state === "success" ? "You're all set." : "Hold on a moment…"}
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted">
        {state === "verifying" && (
          <p className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            Confirming your verification link…
          </p>
        )}
        {state === "success" && (
          <>
            <p>
              Your email is verified. Your account will be active once an
              administrator approves it.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Go to sign in</Link>
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <p>
              This verification link is invalid or has expired.
            </p>
            <Button asChild className="w-full">
              <Link to="/resend-verification">Resend verification link</Link>
            </Button>
          </>
        )}
      </div>
    </AuthCard>
  );
}
