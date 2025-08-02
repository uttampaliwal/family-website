import React from 'react';
import { sanitizeText } from '../utils/sanitization';

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: sanitizeText(message) }}></p>
    </div>
  );
};

export default EmptyState;
