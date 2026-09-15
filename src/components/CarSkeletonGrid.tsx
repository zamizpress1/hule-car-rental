import React from 'react';

export const CarSkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden shadow-xs animate-pulse flex flex-col">
      {/* Skeleton Image Area */}
      <div className="relative w-full h-32 md:h-48 bg-slate-200/90 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
        
        {/* Top Badges Skeleton */}
        <div className="absolute top-2 right-2 w-14 h-4 bg-slate-300/80 rounded" />
        <div className="absolute top-2 left-2 w-6 h-6 bg-slate-300/80 rounded-full" />
        <div className="absolute top-2 left-10 w-20 h-4 bg-slate-300/80 rounded" />
        
        {/* Bottom Price Skeleton */}
        <div className="absolute bottom-0 left-0 w-28 h-6 bg-slate-300/90 rounded-tr-md" />
      </div>

      {/* Skeleton Card Content */}
      <div className="p-2.5 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Title */}
          <div className="h-4 bg-slate-300/90 rounded w-3/4" />
          {/* Subtitle / Specs */}
          <div className="h-3 bg-slate-200/90 rounded w-1/2" />
        </div>

        {/* Footer Badges */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="h-3 bg-slate-200/90 rounded w-1/4" />
          <div className="h-4 bg-slate-300/80 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
};

export const CarSkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-2 md:px-0">
        <div className="h-5 bg-slate-200 rounded w-36 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-6 px-2 md:px-0">
        {Array.from({ length: count }).map((_, i) => (
          <CarSkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
};

export default CarSkeletonGrid;
