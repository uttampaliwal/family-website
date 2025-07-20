import React from 'react';

interface ComponentSkeletonProps {
  rows?: number;
  height?: string;
  className?: string;
}

const ComponentSkeleton: React.FC<ComponentSkeletonProps> = ({
  rows = 3,
  height = 'h-32',
  className = ''
}) => {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`${height} bg-gray-200 dark:bg-gray-700 rounded-lg`}
        />
      ))}
    </div>
  );
};

export default ComponentSkeleton;