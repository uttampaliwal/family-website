import { Button, useToast } from "@family/ui";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthCard } from "../../components/auth/auth-card.js";
import { Field, FieldInput, issueMap } from "../../components/auth/field.js";
import { api } from "../../lib/api-client.js";

export function ResetPasswordPage() {
  const toast = useToast().toast;
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    if (password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      return;
    }
    if (password !== confirm) {
      setErrors({ confirm: "Passwords don't match" });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      toast("Password updated", { variant: "success" });
    } catch (err) {
      const issues = err instanceof Error && "issues" in err
        ? (err as { issues?: { path: string; message: string }[] }).issues
        : undefined;
      if (issues?.length) setErrors(issueMap(issues));
      else {
        toast("Couldn't reset your password", {
          description: "The link may be invalid or expired.",
          variant: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="Invalid link" description="This reset link is missing its token.">
        <Button asChild className="w-full">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password updated" description="You can sign in with your new password.">
        <Button asChild className="w-full">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Choose a strong password for your account.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="New password" htmlFor="password" error={errors.password} hint="At least 8 characters">
          <FieldInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <FieldInput
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            error={errors.confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
