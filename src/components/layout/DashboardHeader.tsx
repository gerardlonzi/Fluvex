'use client';
import { Leaf } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { NotificationBell} from '@/src/components/notifications/NotificationBell';

export function DashboardHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="md:hidden  w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <Leaf className="text-white w-5 h-5" />
        </div>
      <Breadcrumb />
      <NotificationBell />
    </div>
  );
}
