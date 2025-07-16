import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isPrimary?: boolean; // New prop for primary button styling
}

const Button: React.FC<ButtonProps> = ({ label, className, isPrimary = false, ...props }) => {
  const baseClasses = "rounded-xl border px-4 py-3 text-base font-medium font-sans cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1";
  
  const defaultClasses = "border-transparent bg-background-dark text-text-dark hover:border-primary-light focus:outline-none focus:ring-4 focus:ring-primary-light dark:bg-background-light dark:text-text-light";

  const primaryClasses = "border-primary-default bg-primary-default text-white hover:bg-primary-dark hover:border-primary-dark focus:ring-primary-light";

  return (
    <button 
      className={`${baseClasses} ${isPrimary ? primaryClasses : defaultClasses} ${className || ''}`}
      {...props}
    >
      {label}
    </button>
  );
};

export default Button;
