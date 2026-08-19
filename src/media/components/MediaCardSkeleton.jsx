import React from 'react';

export const MediaCardSkeleton = () => {
  return (
    <div className="card h-100 border-0 shadow-sm rounded-xl overflow-hidden app-dark:bg-[#0f172a]!">
      <div className="position-relative overflow-hidden bg-slate-200 app-dark:bg-slate-800! animate-pulse" style={{ aspectRatio: "4/3" }}></div>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="h-4 bg-slate-200 app-dark:bg-slate-700! rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-slate-200 app-dark:bg-slate-700! rounded w-1/4 animate-pulse ms-2"></div>
        </div>
        <div className="d-flex flex-column gap-2 mt-3">
          <div className="h-3 bg-slate-200 app-dark:bg-slate-700! rounded w-2/3 animate-pulse"></div>
          <div className="h-3 bg-slate-200 app-dark:bg-slate-700! rounded w-1/2 animate-pulse"></div>
          <div className="d-flex justify-content-between mt-2">
            <div className="h-3 bg-slate-200 app-dark:bg-slate-700! rounded w-1/3 animate-pulse"></div>
            <div className="h-3 bg-slate-200 app-dark:bg-slate-700! rounded w-1/3 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
