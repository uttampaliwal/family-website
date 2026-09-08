import { Button } from "@family/ui";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../../components/auth/auth-card.js";
import { useI18n } from "../../i18n/index.js";
import { api } from "../../lib/api-client.js";
import { useSeo } from "../../lib/seo.js";
import { tokenFromHash } from "../../lib/url-token.js";

type State = "verifying" | "error" | "success";

export function VerifyEmailPage() {
  useSeo("auth.verify.title");
  const { t } = useI18n();
  // Single-use token from the URL fragment (never in query strings/logs).
  const [token] = useState(() => tokenFromHash());
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
      title={t("verify.title")}
      description={
        state === "success"
          ? t("verify.description.success")
          : state === "error"
            ? t("verify.description.error")
            : t("verify.description.pending")
      }
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted">
        {state === "verifying" && (
          <p className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            {t("verify.pending")}
          </p>
        )}
        {state === "success" && (
          <>
            <p>{t("verify.success.message")}</p>
            <Button asChild className="w-full">
              <Link to="/login">{t("verify.success.action")}</Link>
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <p>{t("verify.error.message")}</p>
            <Button asChild className="w-full">
              <Link to="/resend-verification">{t("verify.error.action")}</Link>
            </Button>
          </>
        )}
      </div>
    </AuthCard>
  );
}
