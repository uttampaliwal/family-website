import { loginSchema } from "@family/core";
import { Button, useToast } from "@family/ui";
import { ApiError } from "../../lib/api-client.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { AuthCard } from "../../components/auth/auth-card.js";
import { Field, FieldInput, issueMap } from "../../components/auth/field.js";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function LoginPage() {
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
      toast("Welcome back", { variant: "success" });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case "INVALID_CREDENTIALS":
            setFormError("That email or password didn't match. Please try again.");
            break;
          case "EMAIL_NOT_VERIFIED":
            setFormError(
              "Your email isn't verified yet — check your inbox for the verification link.",
            );
            break;
          case "PENDING_APPROVAL":
            setFormError(
              "Your account is awaiting approval by an administrator. Please check back soon.",
            );
            break;
          case "ACCESS_REJECTED":
            setFormError("Access was not granted to this account.");
            break;
          case "RATE_LIMITED":
            setFormError("Too many attempts — please wait a minute and try again.");
            break;
          default:
            setFormError(err.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to step into the family nest."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email or username" htmlFor="email" error={errors.email}>
          <FieldInput
            id="email"
            name="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
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
          {submitting ? "Signing in…" : "Sign in"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
          <span className="text-muted">
            New here?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </span>
        </div>
      </form>
    </AuthCard>
  );
}
