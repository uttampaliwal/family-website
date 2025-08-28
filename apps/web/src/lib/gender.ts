export const GENDER_VALUES = ["male", "female", "prefer not to say"] as const;
export type GenderValue = (typeof GENDER_VALUES)[number];

export const GENDER_LABELS: Record<GenderValue, string> = {
  male: "Male",
  female: "Female",
  "prefer not to say": "Prefer not to say",
};

export const GENDER_OPTIONS = (
  includeEmpty: boolean = true,
): { value: GenderValue | ""; label: string }[] => {
  const opts = GENDER_VALUES.map((v) => ({
    value: v,
    label: GENDER_LABELS[v],
  }));
  return includeEmpty ? [{ value: "", label: "Select Gender" }, ...opts] : opts;
};

export function normalizeGender(
  input: string | undefined | null,
): GenderValue | "" {
  if (!input) return "";
  const lower = String(input).toLowerCase();
  return (GENDER_VALUES as readonly string[]).includes(lower)
    ? (lower as GenderValue)
    : "";
}

export function labelForGender(input: string | undefined | null): string {
  const normalized = normalizeGender(input);
  if (!normalized) return "";
  return GENDER_LABELS[normalized as GenderValue];
}
