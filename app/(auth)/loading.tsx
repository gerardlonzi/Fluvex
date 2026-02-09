import { AuthSkeleton } from "@/src/components/loading";

export default function AuthLoading() {
  return (
    <div className="flex justify-center items-start pt-8">
      <AuthSkeleton />
    </div>
  );
}
