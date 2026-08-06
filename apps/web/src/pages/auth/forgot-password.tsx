import { Button } from "@family/ui";
import { useToast } from "@family/ui";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../../components/auth/auth-card.js";
import { Field, FieldInput } from "../../components/auth/field.js";
import { api } from "../../lib/api-client.js";

export function ForgotPasswordPage() {
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
      toast("Couldn't send the reset link", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        description="If an account exists, a reset link is on its way."
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted">
          <p>
            We've sent a password reset link to{" "}
            <span className="font-medium text-foreground">{email}</span>. It
            expires in 30 minutes.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
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
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
        <p className="text-center text-sm text-muted">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
