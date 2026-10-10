import React from 'react';

export const EventSkeletons: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-border/60 bg-card p-0 overflow-hidden shadow-xs animate-pulse flex flex-col justify-between"
        >
          {/* Banner Skeleton */}
          <div className="aspect-[16/9] w-full bg-muted/60 relative">
            <div className="absolute top-3.5 left-3.5 w-20 h-6 rounded-md bg-muted/90" />
            <div className="absolute top-3.5 right-3.5 w-20 h-6 rounded-full bg-muted/90" />
          </div>

          {/* Body Skeleton */}
          <div className="p-5 sm:p-6 space-y-3.5 flex-1">
            <div className="h-4 w-1/2 rounded bg-muted/70" />
            <div className="h-6 w-3/4 rounded-lg bg-muted/80" />
            <div className="space-y-1.5 pt-1">
              <div className="h-3.5 w-full rounded bg-muted/60" />
              <div className="h-3.5 w-4/5 rounded bg-muted/60" />
            </div>

            <div className="pt-3 border-t border-border/50 space-y-2">
              <div className="h-4 w-2/3 rounded bg-muted/60" />
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="px-5 py-3.5 bg-muted/30 border-t border-border/50 flex items-center justify-between">
            <div className="h-9 w-24 rounded-xl bg-muted/80" />
            <div className="h-9 w-24 rounded-xl bg-muted/80" />
          </div>
        </div>
      ))}
    </div>
  );
};
