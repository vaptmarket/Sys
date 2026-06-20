import React from 'react';

export default function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-surface-panel rounded-3xl overflow-hidden border border-white/5 h-[400px] flex flex-col">
          <div className="w-full aspect-video bg-white/5" />
          <div className="p-6 space-y-4 flex-1">
            <div className="space-y-2">
              <div className="w-24 h-3 bg-white/10 rounded-full" />
              <div className="w-full h-6 bg-white/10 rounded-full" />
              <div className="w-32 h-3 bg-white/5 rounded-full" />
            </div>
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="w-20 h-8 bg-white/10 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="h-12 bg-white/5 rounded-xl" />
              <div className="h-12 bg-white/5 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
