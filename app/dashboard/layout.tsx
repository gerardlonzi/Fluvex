import { Sidebar } from "@/src/components/layout/sidebar";
import { Breadcrumb } from "@/src/components/layout/Breadcrumb";
import { DashboardAuthGuard } from "@/src/components/auth/DashboardAuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <div className="flex min-h-screen bg-background text-text-main font-sans">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </DashboardAuthGuard>
  );
}