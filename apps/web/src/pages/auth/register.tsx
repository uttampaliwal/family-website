import { genderSchema, registerSchema, relationshipSchema } from "@family/core";
import { Button } from "@family/ui";
import { ApiError } from "../../lib/api-client.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { AuthCard } from "../../components/auth/auth-card.js";
import { Field, FieldInput, FieldPassword, FieldSelect, issueMap } from "../../components/auth/field.js";
import { UsernameAvailability } from "../../components/auth/username-availability.js";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/index.js";
import { useSeo } from "../../lib/seo.js";

const RELATIONSHIPS = relationshipSchema.options;
const GENDERS = genderSchema.options;

export function RegisterPage() {
  const { t } = useI18n();
  useSeo("register.title", "seo.home.desc");
  const register = useAuthStore((s) => s.register);

  const [values, setValues] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    relationship: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameUnavailable, setUsernameUnavailable] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = registerSchema.safeParse({
      ...values,
      dateOfBirth: values.dateOfBirth || undefined,
      gender: values.gender || undefined,
      relationship: values.relationship || undefined,
      phoneNumber: values.phoneNumber || undefined,
    });
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
      await register(parsed.data);
      setRegisteredEmail(parsed.data.email);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ACCOUNT_EXISTS") {
          setFormError(
            t("register.error.accountExists"),
          );
        } else if (err.code === "RATE_LIMITED") {
          setFormError(t("register.error.rateLimited"));
        } else if (err.code === "VALIDATION_ERROR") {
          setErrors(issueMap(err.issues));
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError(t("register.error.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (registeredEmail) {
    return (
      <AuthCard
        title={t("register.success.title")}
        description={t("register.success.description")}
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted">
          <p>
            {t("register.success.message").replace("{email}", registeredEmail)}
          </p>
          <p>
            {t("register.success.resend").split("Resend the link")[0]}{" "}
            <Link
              to="/resend-verification"
              className="font-medium text-primary hover:underline"
            >
              Resend the link
            </Link>
          </p>
          <div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">{t("register.success.backToSignIn")}</Link>
            </Button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("register.title")} description={t("register.description")}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label={t("register.name")} htmlFor="name" error={errors.name}>
            <FieldInput
              id="name"
              name="name"
              autoComplete="name"
              placeholder={t("register.namePlaceholder")}
              value={values.name}
            error={errors.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("register.email")} htmlFor="email" error={errors.email}>
            <FieldInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              error={errors.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </Field>
          <Field label={t("register.username")} htmlFor="username" error={errors.username} hint={t("register.usernameHint")}>
            <FieldInput
              id="username"
              name="username"
              autoComplete="username"
              placeholder="aarav_s"
              value={values.username}
              error={errors.username}
              onChange={(e) => set("username", e.target.value)}
              required
            />
            <UsernameAvailability
              username={values.username}
              onResult={(r) => {
                setUsernameChecking(r.checking);
                setUsernameUnavailable(!r.available);
              }}
            />
          </Field>
        </div>
        <Field label={t("register.password")} htmlFor="password" error={errors.password}>
          <FieldPassword
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={values.password}
            error={errors.password}
            onChange={(e) => set("password", e.target.value)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("register.dateOfBirth")} htmlFor="dateOfBirth" error={errors.dateOfBirth}>
            <FieldInput
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={values.dateOfBirth}
              error={errors.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </Field>
          <Field label={t("register.gender")} htmlFor="gender" error={errors.gender}>
            <FieldSelect
              id="gender"
              name="gender"
              value={values.gender}
              onChange={(e) => set("gender", e.target.value)}
              options={GENDERS}
              error={errors.gender}
            />
          </Field>
          <Field label={t("register.relationship")} htmlFor="relationship" error={errors.relationship}>
            <FieldSelect
              id="relationship"
              name="relationship"
              value={values.relationship}
              onChange={(e) => set("relationship", e.target.value)}
              options={RELATIONSHIPS}
              getOptionLabel={(r) => r.replaceAll("_", " ")}
              error={errors.relationship}
            />
          </Field>
        </div>
        <Field label={t("register.phoneNumber")} htmlFor="phoneNumber" error={errors.phoneNumber}>
          <FieldInput
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            placeholder={t("register.phoneNumberPlaceholder")}
            value={values.phoneNumber}
            error={errors.phoneNumber}
            onChange={(e) => set("phoneNumber", e.target.value)}
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

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={submitting || usernameChecking || usernameUnavailable}
        >
          {(submitting || usernameChecking) && <Loader2 className="size-4 animate-spin" />}
          {submitting ? t("register.submitting") : t("register.submit")}
        </Button>

        <p className="text-center text-sm text-muted">
          {t("register.already")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("register.signIn")}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
