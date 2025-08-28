import React from "react";
import ButtonBase, {
  type ButtonVariant,
  type ButtonSize,
} from "./ui/ButtonBase";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  label,
  className = "",
  variant = "default",
  size = "md",
  icon,
  loading = false,
  ...props
}) => {
  return (
    <ButtonBase
      variant={variant}
      size={size}
      loading={loading}
      className={className}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </ButtonBase>
  );
};

export default Button;
