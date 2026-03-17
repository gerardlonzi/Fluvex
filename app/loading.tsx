import { PageSkeleton } from "@/src/components/loading";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-8">
      <PageSkeleton withHeader cards={0} lines={6} />
    </div>
  );
}
