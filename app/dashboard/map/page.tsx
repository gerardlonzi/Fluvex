'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/src/components/loading';

const FleetMap = dynamic(
  () => import('@/src/components/features/map/fleetMap').then((m) => m.default),
  {
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-border/30">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    ),
    ssr: false,
  }
);

const RoutePanel = dynamic(
  () => import('@/src/components/features/map/RoutePanel').then((m) => ({ default: m.RoutePanel })),
  {
    loading: () => (
      <aside className="w-96 bg-surface border-l border-border flex flex-col p-6 gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex-1 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </aside>
    ),
    ssr: false,
  }
);

export default function MapPage() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden -m-8 mt-[-32px]">
      <main className="flex-1 relative border-r border-border">
        <FleetMap />
        <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </main>
      <RoutePanel />
    </div>
  );
}