"use client";

import { Skeleton } from "./Skeleton";

export function MapSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden -m-8 mt-[-32px] animate-in fade-in duration-300">
      <div className="flex-1 flex flex-col border-r border-border">
        <Skeleton className="flex-1 w-full rounded-none" />
      </div>
      <aside className="w-96 bg-surface/50 border-border flex flex-col p-6 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <div className="flex-1 space-y-3 mt-4">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </aside>
    </div>
  );
}
