import React from "react";

interface LoadingIndicatorProps {
  fullScreen?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ fullScreen }) => {
  return (
    <div
      className={`w-full ${fullScreen ? "min-h-[60vh]" : "min-h-[200px]"} flex flex-col items-center justify-center text-center`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <img
        src="/family-icon.svg"
        alt="Loading"
        className="h-20 w-20 object-contain mb-4 animate-pulse"
      />
      <div className="text-lg font-medium text-gray-700 dark:text-gray-200">
        Loading . . .
      </div>
    </div>
  );
};

export default LoadingIndicator;
