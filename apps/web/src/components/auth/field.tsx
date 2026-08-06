import { Input, Label, cn } from "@family/ui";
import type { ReactNode } from "react";

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
        <p className="text-xs font-medium text-error" id={`${htmlFor}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function FieldInput({
  id,
  error,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; error?: string }) {
  return (
    <Input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(error && "border-error focus-visible:border-error focus-visible:ring-error/30")}
      {...props}
    />
  );
}

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
