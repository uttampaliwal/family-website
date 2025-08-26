import React from "react";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  return (
    <input
      {...props}
      ref={ref}
      className="w-full px-4 py-2 border border-border rounded-md bg-surface text-base focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
});

Input.displayName = "Input";

export default Input;
