import React from 'react';

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

export default EmptyState;
