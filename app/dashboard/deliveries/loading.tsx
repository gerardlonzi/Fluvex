import { PageSkeleton } from "@/src/components/loading";

export default function AnalyticsLoading() {
  return <PageSkeleton withHeader cards={4} lines={0} />;
}
