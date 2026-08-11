import { Button } from "@family/ui";
import { useToast } from "@family/ui";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../../components/auth/auth-card.js";
import { Field, FieldInput } from "../../components/auth/field.js";
import { api } from "../../lib/api-client.js";
import { useSeo } from "../../lib/seo.js";
import { useI18n } from "../../i18n/index.js";

export function ForgotPasswordPage() {
  useSeo("auth.forgot.title");
  const { t } = useI18n();
  const toast = useToast().toast;
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast(t("forgot.error"), { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthCard
        title={t("forgot.success.title")}
        description={t("forgot.success.description")}
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted">
          <p>
            {t("forgot.success.message").replace("{email}", email)}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">{t("forgot.success.backToSignIn")}</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("forgot.title")}
      description={t("forgot.description")}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={t("forgot.email")} htmlFor="email">
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
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? t("forgot.submitting") : t("forgot.submit")}
        </Button>
        <p className="text-center text-sm text-muted">
          {t("forgot.remembered")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("forgot.signIn")}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
