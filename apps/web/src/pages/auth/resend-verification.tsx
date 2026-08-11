import { Button } from "@family/ui";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../../components/auth/auth-card.js";
import { Field, FieldInput } from "../../components/auth/field.js";
import { api } from "../../lib/api-client.js";
import { useSeo } from "../../lib/seo.js";
import { useI18n } from "../../i18n/index.js";

export function ResendVerificationPage() {
  useSeo("auth.resend.title");
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/resend-verification", { email });
      setSent(true);
    } catch {
      setError(t("resend.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthCard
        title={t("resend.success.title")}
        description={t("resend.success.description")}
      >
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">{t("resend.success.backToSignIn")}</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("resend.title")}
      description={t("resend.description")}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={t("resend.email")} htmlFor="email">
          <FieldInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error"
          >
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? t("resend.submitting") : t("resend.submit")}
        </Button>
        <p className="text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("resend.backToSignIn")}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
