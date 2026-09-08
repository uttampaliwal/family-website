import { relationshipSchema } from "@family/core";
import { Button, useToast } from "@family/ui";
import { useState, type FormEvent } from "react";
import { Field, FieldInput, issueMap } from "../../components/auth/field.js";
import { roleLabelKey } from "../../components/role-badge.js";
import { useI18n } from "../../i18n/index.js";
import { ApiError, api } from "../../lib/api-client.js";
import { useSeo } from "../../lib/seo.js";
import { useAuthStore } from "../../stores/auth-store.js";

const RELATIONSHIPS = relationshipSchema.options;

export function MyProfilePage() {
  useSeo("account.profile");
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const toast = useToast().toast;
  const [name, setName] = useState(user?.name ?? "");
  const [relationship, setRelationship] = useState(user?.relationship ?? "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await api.patch("/members/me", {
        name: name.trim() || undefined,
        relationship: relationship || null,
        phoneNumber: phoneNumber.trim() || null,
      });
      toast("Profile updated", { variant: "success" });
    } catch (err) {
      if (err instanceof ApiError && err.issues?.length) {
        setErrors(issueMap(err.issues));
      } else {
        toast("Couldn't update your profile", { variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function onExport() {
    setExporting(true);
    try {
      const data = await api.get<unknown>("/members/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `kulaya-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast("Export downloaded", { variant: "success" });
    } catch {
      toast("Couldn't prepare your export", { variant: "error" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        My profile
      </h1>
      <p className="mt-1 text-sm text-muted">
        Signed in as @{user?.username} ·{" "}
        {user ? t(roleLabelKey[user.role]) : ""}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <FieldInput
            id="name"
            name="name"
            value={name}
            error={errors.name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field
          label="Relationship to the family"
          htmlFor="relationship"
          error={errors.relationship}
        >
          <select
            id="relationship"
            name="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <option value="">—</option>
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {r.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Phone number (optional)"
          htmlFor="phoneNumber"
          error={errors.phoneNumber}
        >
          <FieldInput
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="+91 98765 43210"
            value={phoneNumber}
            error={errors.phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </Field>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <section
        aria-label="Data export"
        className="mt-10 border-t border-border pt-6"
      >
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted">
          Download everything the nest holds about you — profile, posts, events,
          photos and documents — as JSON.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={exporting}
          onClick={() => void onExport()}
        >
          {exporting ? "Preparing…" : "Export my data"}
        </Button>
      </section>
    </div>
  );
}
