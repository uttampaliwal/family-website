import React from "react";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return <div className={`bg-surface rounded animate-pulse ${className}`} />;
};

export default Skeleton;
