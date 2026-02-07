'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Truck, Map as MapIcon, 
  BarChart3, Leaf, Settings, Users, LogOut 
} from 'lucide-react';
import { clsx } from 'clsx'; // Utile pour les classes conditionnelles

const menuItems = [
  { name: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Gestion de Flotte', icon: Truck, href: '/dashboard/fleet' },
  { name: 'Carte en temps réel', icon: MapIcon, href: '/dashboard/map' },
  { name: 'Analytique', icon: BarChart3, href: '/dashboard/analytics' },
  { name: 'Performance', icon: Users, href: '/dashboard/drivers' },
  { name: 'Impact Écologique', icon: Leaf, href: '/dashboard/sustainability' },
  { name: 'Paramètres', icon: Settings, href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Leaf className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">FLUVEX</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-text-muted hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-text-muted hover:text-danger transition-colors text-sm font-medium">
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}