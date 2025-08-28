import React from "react";

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const ButtonBase: React.FC<ButtonBaseProps> = ({
  children,
  className = "",
  variant = "default",
  size = "md",
  loading = false,
  disabled,
  ...props
}) => {
  const baseClasses = "btn";
  const variantClassMap: Record<ButtonVariant, string> = {
    default: "btn-ghost",
    primary: "btn-primary",
    secondary: "btn-secondary",
    success: "btn-success",
    warning: "btn-warning",
    error: "btn-error",
    ghost: "btn-ghost",
  };
  const sizeClassMap: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const classes = [
    baseClasses,
    variantClassMap[variant],
    sizeClassMap[size],
    loading && "opacity-75 cursor-not-allowed",
    (disabled || loading) && "opacity-50 cursor-not-allowed",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {children}
    </button>
  );
};

export default ButtonBase;
