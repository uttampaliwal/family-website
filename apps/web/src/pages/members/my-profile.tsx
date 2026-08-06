import { relationshipSchema } from "@family/core";
import { Button, useToast } from "@family/ui";
import { ApiError, api } from "../../lib/api-client.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { Field, FieldInput, issueMap } from "../../components/auth/field.js";
import { useState, type FormEvent } from "react";

const RELATIONSHIPS = relationshipSchema.options;

export function MyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const toast = useToast().toast;
  const [name, setName] = useState(user?.name ?? "");
  const [relationship, setRelationship] = useState(user?.relationship ?? "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">My profile</h1>
      <p className="mt-1 text-sm text-muted">
        Signed in as @{user?.username} · {user?.role === "admin" ? "admin" : "member"}
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
        <Field label="Relationship to the family" htmlFor="relationship" error={errors.relationship}>
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
        <Field label="Phone number (optional)" htmlFor="phoneNumber" error={errors.phoneNumber}>
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
    </div>
  );
}
