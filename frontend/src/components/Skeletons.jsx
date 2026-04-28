import React from 'react';

export const SkeletonOrder = () => (
  <div className="card-serious p-4 border-l-4 border-slate-200 animate-pulse">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3 w-16 bg-slate-200 rounded ml-auto" />
        <div className="h-4 w-20 bg-slate-200 rounded ml-auto" />
      </div>
    </div>
    <div className="h-10 bg-slate-200 rounded-2xl w-full" />
  </div>
);

export const SkeletonProduct = () => (
  <div className="card-serious p-6 flex items-center justify-between animate-pulse">
    <div className="flex items-center gap-6">
      <div className="w-20 h-20 bg-slate-200 rounded-[2rem]" />
      <div className="space-y-3">
        <div className="h-6 w-40 bg-slate-200 rounded" />
        <div className="h-4 w-60 bg-slate-200 rounded" />
        <div className="h-6 w-24 bg-slate-200 rounded" />
      </div>
    </div>
    <div className="w-32 h-12 bg-slate-200 rounded-2xl" />
  </div>
);
