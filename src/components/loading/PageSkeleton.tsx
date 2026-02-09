"use client";

import { Skeleton } from "./Skeleton";

interface PageSkeletonProps {
  /** Nombre de lignes de contenu */
  lines?: number;
  /** Afficher un header + CTA */
  withHeader?: boolean;
  /** Nombre de cartes (pour grille) */
  cards?: number;
}

export function PageSkeleton({
  lines = 4,
  withHeader = true,
  cards = 0,
}: PageSkeletonProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {withHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      )}
      {cards > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: i === lines - 1 ? "80%" : "100%" }}
          />
        ))}
      </div>
    </div>
  );
}
