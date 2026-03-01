'use client';
import { Leaf } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { NotificationBell} from '@/src/components/notifications/NotificationBell';
import Image from 'next/image'

export function DashboardHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="md:hidden  flex items-center justify-center shrink-0">
          <Image src='/mini-logo.png'  alt='mini logo' width={60} height={60} />
        </div>
      <Breadcrumb />
      <NotificationBell />
    </div>
  );
}
