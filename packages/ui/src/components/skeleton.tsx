import { cn } from "../lib/cn.js";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-surface-2", className)}
      {...props}
    />
  );
}
