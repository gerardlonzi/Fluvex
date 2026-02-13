'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Truck, Map as MapIcon,
  BarChart3, Leaf, Settings, Users, TruckIcon, Building2
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/src/contexts/language-context';
import { t } from '@/lib/i18n';

const menuKeys: { key: string; icon: typeof LayoutDashboard; href: string }[] = [
  { key: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'nav.fleet', icon: Truck, href: '/dashboard/fleet' },
  { key: 'nav.map', icon: MapIcon, href: '/dashboard/map' },
  { key: 'nav.deliveries', icon: TruckIcon, href: '/dashboard/deliveries' },
  { key: 'nav.analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { key: 'nav.performance', icon: Users, href: '/dashboard/drivers' },
  { key: 'nav.sustainability', icon: Leaf, href: '/dashboard/sustainability' },
  { key: 'nav.settings', icon: Settings, href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    fetch('/api/company', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.logoUrl) setCompanyLogo(data.logoUrl);
        if (data?.name) setCompanyName(data.name);
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <Leaf className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-text-main tracking-tight">FLUVEX</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuKeys.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:bg-border hover:text-text-main"
              )}
            >
              <item.icon className="w-5 h-5" />
              {t(lang, item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Bas : nom et logo entreprise → Paramètres */}
      <div className="p-4 border-t border-border mt-auto">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-border/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-border border border-border flex items-center justify-center overflow-hidden shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 text-text-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-main truncate">{companyName || t(lang, 'sidebar.profile')}</p>
            <p className="text-xs text-text-muted">{t(lang, 'sidebar.settings')}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}