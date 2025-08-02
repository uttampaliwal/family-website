import React, { useMemo } from 'react';

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
  const skeletonItems = useMemo(() => 
    Array.from({ length: rows }, (_, index) => (
      <div
        key={`skeleton-${index}`}
        className={`${height} bg-gray-200 dark:bg-gray-700 rounded-lg`}
      />
    )), [rows, height]
  );

  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {skeletonItems}
    </div>
  );
};

export default ComponentSkeleton;