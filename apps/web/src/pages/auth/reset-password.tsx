import { Button, useToast } from "@family/ui";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../../components/auth/auth-card.js";
import { Field, FieldPassword, issueMap } from "../../components/auth/field.js";
import { useI18n } from "../../i18n/index.js";
import { api } from "../../lib/api-client.js";
import { useSeo } from "../../lib/seo.js";
import { tokenFromHash } from "../../lib/url-token.js";

export function ResetPasswordPage() {
  useSeo("auth.reset.title");
  const { t } = useI18n();
  const toast = useToast().toast;
  // Single-use token from the URL fragment (never in query strings/logs).
  const [token] = useState(() => tokenFromHash());
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    if (password.length < 8) {
      setErrors({ password: t("reset.error.length") });
      return;
    }
    if (password !== confirm) {
      setErrors({ confirm: t("reset.error.match") });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      toast("Password updated", { variant: "success" });
    } catch (err) {
      const issues =
        err instanceof Error && "issues" in err
          ? (err as { issues?: { path: string; message: string }[] }).issues
          : undefined;
      if (issues?.length) setErrors(issueMap(issues));
      else {
        toast(t("reset.error.generic"), {
          variant: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthCard
        title={t("reset.invalid.title")}
        description={t("reset.invalid.description")}
      >
        <Button asChild className="w-full">
          <Link to="/forgot-password">{t("reset.invalid.action")}</Link>
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard
        title={t("reset.success.title")}
        description={t("reset.success.description")}
      >
        <Button asChild className="w-full">
          <Link to="/login">{t("reset.success.action")}</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("reset.title")} description={t("reset.description")}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          label={t("reset.password")}
          htmlFor="password"
          error={errors.password}
          hint={t("reset.passwordHint")}
        >
          <FieldPassword
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field
          label={t("reset.confirm")}
          htmlFor="confirm"
          error={errors.confirm}
        >
          <FieldPassword
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            error={errors.confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </Field>
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={submitting}
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? t("reset.submitting") : t("reset.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
