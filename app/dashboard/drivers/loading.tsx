import { PageSkeleton } from "@/src/components/loading";

export default function DriversLoading() {
  return <PageSkeleton withHeader cards={3} lines={4} />;
}
