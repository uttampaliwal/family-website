import React from "react";
import { sanitizeText } from "../utils/sanitization";

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="text-center py-12">
      <div className="card max-w-md mx-auto">
        <p className="body-lg text-readable-muted">{sanitizeText(message)}</p>
      </div>
    </div>
  );
};

export default EmptyState;
