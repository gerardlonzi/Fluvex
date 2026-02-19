'use client';

import { Sidebar } from './sidebar';
import { SidebarProvider, useSidebar } from '@/src/contexts/sidebar-context';
import { DashboardHeader } from './DashboardHeader';
import { clsx } from 'clsx';

function DashboardMain({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main
      className={clsx(
        'flex-1 p-3 md:p-8 overflow-y-auto transition-[margin-left] duration-200',
        collapsed ? 'md:ml-16' : 'md:ml-64'
      )}
    >
      <DashboardHeader />
      {children}
    </main>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex md:min-h-screen bg-background text-text-main font-sans">
        <Sidebar />
        <DashboardMain>{children}</DashboardMain>
      </div>
    </SidebarProvider>
  );
}
