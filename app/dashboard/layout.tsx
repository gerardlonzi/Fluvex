import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/src/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <DashboardShell>{children}</DashboardShell>;
}
