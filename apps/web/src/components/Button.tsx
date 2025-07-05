import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isPrimary?: boolean; // New prop for primary button styling
}

const Button: React.FC<ButtonProps> = ({ label, className, isPrimary = false, ...props }) => {
  const baseClasses = "rounded-lg border px-4 py-2 text-base font-medium font-sans cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1";
  
  const defaultClasses = "border-transparent bg-gray-900 text-white hover:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-300";
  const lightModeClasses = "dark:bg-gray-100 dark:text-gray-800";

  const primaryClasses = "border-blue-500 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-600 focus:ring-blue-400";

  return (
    <button 
      className={`${baseClasses} ${isPrimary ? primaryClasses : defaultClasses} ${lightModeClasses} ${className || ''}`}
      {...props}
    >
      {label}
    </button>
  );
};

export default Button;
