import React from "react";

const DocumentCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface p-4 rounded-lg shadow-md border border-border/20 animate-pulse">
      <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
      <div className="flex justify-end items-center mt-4 pt-4 border-t border-border/20">
        <div className="h-8 w-20 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
      </div>
    </div>
  );
};

export default DocumentCardSkeleton;
