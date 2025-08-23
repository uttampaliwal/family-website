import React from "react";
import { sanitizeText } from "../utils/sanitization";

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="text-center py-12">
      <p className="text-muted">{sanitizeText(message)}</p>
    </div>
  );
};

export default EmptyState;
