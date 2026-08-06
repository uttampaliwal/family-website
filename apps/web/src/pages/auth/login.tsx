import { loginSchema } from "@family/core";
import { Button, useToast } from "@family/ui";
import { ApiError } from "../../lib/api-client.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { AuthCard } from "../../components/auth/auth-card.js";
import { Field, FieldInput, issueMap } from "../../components/auth/field.js";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n/index.js";
import { useSeo } from "../../lib/seo.js";

export function LoginPage() {
  const { t } = useI18n();
  useSeo("login.title", "seo.home.desc");
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast().toast;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(
        issueMap(
          parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        ),
      );
      return;
    }

    setSubmitting(true);
    try {
      await login(parsed.data);
      toast(t("login.success"), { variant: "success" });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case "INVALID_CREDENTIALS":
            setFormError(t("login.error.invalid"));
            break;
          case "EMAIL_NOT_VERIFIED":
            setFormError(t("login.error.notVerified"));
            break;
          case "PENDING_APPROVAL":
            setFormError(t("login.error.pending"));
            break;
          case "ACCESS_REJECTED":
            setFormError(t("login.error.rejected"));
            break;
          case "RATE_LIMITED":
            setFormError(t("login.error.rateLimited"));
            break;
          default:
            setFormError(err.message);
        }
      } else {
        setFormError(t("login.error.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title={t("login.title")} description={t("login.description")}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={t("login.email")} htmlFor="email" error={errors.email}>
          <FieldInput
            id="email"
            name="email"
            autoComplete="username"
            placeholder={t("login.emailPlaceholder")}
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label={t("login.password")} htmlFor="password" error={errors.password}>
          <FieldInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error"
          >
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {t("login.submit")}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            {t("login.forgot")}
          </Link>
          <span className="text-muted">
            {t("login.noAccount")}{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t("login.createAccount")}
            </Link>
          </span>
        </div>
      </form>
    </AuthCard>
  );
}
