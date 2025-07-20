import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isPrimary?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'default';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  label, 
  className, 
  isPrimary = false, 
  color = 'default',
  icon,
  ...props 
}) => {
  const baseClasses = "rounded-lg px-4 py-3 text-base font-medium cursor-pointer transition-all duration-200 flex items-center justify-center";
  
  // Default styling
  const defaultClasses = "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500";

  // Primary styling with gradient background
  const primaryClasses = "gradient-bg text-white shadow-md hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500";
  
  // Color-specific styling
  const colorClasses = {
    default: '',
    blue: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
    green: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
    yellow: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    red: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
  };

  const buttonClasses = isPrimary ? primaryClasses : color !== 'default' ? colorClasses[color] : defaultClasses;

  return (
    <button 
      className={`${baseClasses} ${buttonClasses} ${className || ''}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
};

export default Button;
