import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  label,
  className,
  variant = 'default',
  icon,
  ...props
}) => {
  const baseStyle = "rounded-lg px-4 py-3 text-base font-medium cursor-pointer transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyles = {
    default: "bg-surface text-text-base hover:bg-surface/80 focus:ring-primary",
    primary: "bg-gradient-primary text-white shadow-md hover:scale-105 transform transition-transform duration-200 focus:ring-primary",
    secondary: "bg-secondary text-text-base shadow-md hover:bg-secondary/90 focus:ring-secondary",
    success: "bg-success text-white shadow-md hover:bg-success/90 focus:ring-success",
    warning: "bg-warning text-text-base shadow-md hover:bg-warning/90 focus:ring-warning",
    error: "bg-error text-white shadow-md hover:bg-error/90 focus:ring-error",
  };

  const buttonClasses = `${baseStyle} ${variantStyles[variant]} ${className || ''}`;

  return (
    <button
      className={buttonClasses}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
};

export default Button;