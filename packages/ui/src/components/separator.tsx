import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export const Separator = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation="horizontal"
    className={cn("h-px w-full bg-border", className)}
    {...props}
  />
));
Separator.displayName = "Separator";
