import { PageSkeleton } from "@/src/components/loading";

export default function FleetLoading() {
  return <PageSkeleton withHeader cards={0} lines={8} />;
}
