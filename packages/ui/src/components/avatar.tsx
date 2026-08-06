import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "", size = "md", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary/12 font-semibold text-primary",
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{children}</span>
      )}
    </div>
  ),
);
Avatar.displayName = "Avatar";
