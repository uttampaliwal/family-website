import React from "react";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => {
  return (
    <textarea
      {...props}
      ref={ref}
      className="w-full px-4 py-2 border border-border rounded-md bg-surface text-base focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
});

Textarea.displayName = "Textarea";

export default Textarea;
