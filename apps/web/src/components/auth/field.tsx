import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import { Button, Input, Label, cn } from "@family/ui";
import type { ReactNode } from "react";
import { useI18n } from "../../i18n/index.js";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className={cn(error && "text-error")}>
        {label}
      </Label>
      {children}
      {error ? (
        <p
          className="text-xs font-medium text-error"
          id={`${htmlFor}-error`}
          aria-live="polite"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const FieldInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & { id: string; error?: string }
>(({ id, error, ...props }, ref) => (
  <Input
    ref={ref}
    id={id}
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? `${id}-error` : undefined}
    className={cn(error && "border-error focus-visible:border-error focus-visible:ring-error/30")}
    {...props}
  />
));
FieldInput.displayName = "FieldInput";

/** Password input with a show/hide toggle. */
export const FieldPassword = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, "type"> & {
    id: string;
    error?: string;
  }
>(({ id, error, ...props }, ref) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        id={id}
        type={visible ? "text" : "password"}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "pr-11",
          error && "border-error focus-visible:border-error focus-visible:ring-error/30",
        )}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("password.hide") : t("password.show")}
        title={visible ? t("password.hide") : t("password.show")}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
});
FieldPassword.displayName = "FieldPassword";

/** Map `{ path, message }` validation issues to field-level errors. */
export function issueMap(
  issues?: { path: string; message: string }[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of issues ?? []) {
    if (!map[issue.path]) map[issue.path] = issue.message;
  }
  return map;
}

/** Select input with consistent styling and error handling. */
export function FieldSelect({
  id,
  error,
  placeholder = "Select...",
  options,
  getOptionLabel,
  ...props
}: {
  id: string;
  error?: string;
  placeholder?: string;
  options: readonly string[];
  getOptionLabel?: (value: string) => string;
} & Omit<React.ComponentProps<"select">, "children" | "id">) {
  return (
    <select
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-error focus-visible:border-error focus-visible:ring-error/30",
      )}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((value) => (
        <option key={value} value={value}>
          {getOptionLabel ? getOptionLabel(value) : value}
        </option>
      ))}
    </select>
  );
}
