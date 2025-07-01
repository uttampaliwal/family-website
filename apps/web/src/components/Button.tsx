import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const Button: React.FC<ButtonProps> = ({ label, ...props }) => {
  return (
    <button className="button" {...props}>
      {label}
    </button>
  );
};

export default Button;
