"use client";

import { Skeleton } from "./Skeleton";

export function AuthSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-md">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="text-center">
        <Skeleton className="h-4 w-56 mx-auto" />
      </div>
    </div>
  );
}
