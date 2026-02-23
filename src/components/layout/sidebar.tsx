'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Truck, Map as MapIcon,
  BarChart3, Leaf, Settings, Users, Package, Building2,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/src/contexts/language-context';
import { useSidebar } from '@/src/contexts/sidebar-context';
import { t } from '@/lib/i18n';
import Image from "next/image";


const menuKeys: { key: string; icon: typeof LayoutDashboard; href: string }[] = [
  { key: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'nav.fleet', icon: Truck, href: '/dashboard/fleet' },
  { key: 'nav.map', icon: MapIcon, href: '/dashboard/map' },
  { key: 'nav.deliveries', icon: Package, href: '/dashboard/deliveries' },
  { key: 'nav.analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { key: 'nav.performance', icon: Users, href: '/dashboard/drivers' },
  { key: 'nav.sustainability', icon: Leaf, href: '/dashboard/sustainability' }
];

export function Sidebar() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { collapsed, toggle } = useSidebar();
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
    <aside
      className={clsx(
        'bg-surface border-r border-border h-14 md:h-screen flex-row  flex md:flex-col fixed bottom-0 left-0 md:top-0 z-30 transition-[width] duration-200',
        collapsed ? 'md:w-16 w-full' : 'md:w-64  w-full'
      )}
    >
      <div className={clsx('hidden  md:flex items-center border-b border-border shrink-0', collapsed ? 'p-3 justify-center' : 'p-6 gap-3')}>
       
        {collapsed ?  <Image
                       src="/mini-logo.png"       
                       alt="mini-logo"
                       width={300}            
                       height={300}     
                      /> 
                      : 
                      <>
                      <Image
                       src="/logo-light.png"       
                       alt="logo light"
                       width={100}            
                       height={100} 
                       className='light-hidden'    
                      />
                      <Image
                       src="/logo-dark.png"       
                       alt="logo light"
                       width={100}            
                       height={100}  
                       className='dark-hidden '    
   
                       />
                       </>
                      }
                      
      </div>

      

      {/* Navigation */}
      <nav className="flex-row justify-between md:justify-normal flex md:block flex-1 px-2 space-y-1 mt-2 overflow-y-auto">
        {menuKeys.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 w-full justify-center md:justify-normal  md:px-3 md:py-3 rounded-xl transition-all duration-200 text-sm font-medium',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-muted hover:bg-border hover:text-text-main'
              )}
              title={collapsed ? t(lang, item.key) : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="md:truncate hidden md:block">{t(lang, item.key)}</span>}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={toggle}
        className={clsx(
          'hidden md:flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:bg-border hover:text-text-main transition-colors mt-2 mx-2',
          collapsed && 'justify-center px-0'
        )}
        title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
        aria-label={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
      >
        {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        {!collapsed && <span>Réduire</span>}
      </button>
      {/* Bas : entreprise → Paramètres */}
      <div className={clsx('md:p-2 border-t border-border mt-auto', collapsed && 'flex justify-center')}>
        <Link
          href="/dashboard/settings"
          className={clsx(
            'flex items-center rounded-xl border border-border hover:bg-border/50 transition-colors',
            collapsed ? 'p-2 justify-center' : 'gap-3 px-4 py-3'
          )}
          title={collapsed ? (companyName || t(lang, 'sidebar.settings')) : undefined}
        >
          <div className="w-10 h-10 rounded-xl bg-border border border-border flex items-center justify-center overflow-hidden shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 text-text-muted" />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 hidden md:block ">
              <p className="text-sm font-bold text-text-main truncate">{companyName || t(lang, 'sidebar.profile')}</p>
              <p className="text-xs text-text-muted">{t(lang, 'sidebar.settings')}</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}