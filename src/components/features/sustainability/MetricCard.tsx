import { ArrowUpRight, LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: string;
  progress: number;
  icon: LucideIcon;
  color: 'emerald' | 'blue' | 'amber';
}

export function MetricCard({ title, value, subtitle, trend, progress, icon: Icon, color }: MetricCardProps) {
  // Mapping des couleurs pour le support dynamique
  const colors = {
    emerald: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
      trendBg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      bar: "bg-blue-500",
      trendBg: "bg-blue-50 dark:bg-blue-900/20",
    },
    amber: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-600 dark:text-amber-400",
      bar: "bg-amber-500",
      trendBg: "bg-amber-50 dark:bg-amber-900/20",
    },
  };

  const theme = colors[color];

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-surface border border-border p-6 shadow-sm hover:shadow-md transition-all">
      {/* Cercle décoratif en arrière-plan */}
      <div className={clsx(
        "absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full transition-transform group-hover:scale-110 opacity-10",
        theme.bar.replace('bg-', 'bg-') // Petit hack pour réutiliser la couleur de base
      )}></div>

      <div className="flex items-start justify-between mb-4">
        <div className={clsx("rounded-lg p-2", theme.bg, theme.text)}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={clsx("flex items-center text-xs font-bold px-2 py-1 rounded-full", theme.trendBg, theme.text)}>
          <ArrowUpRight className="w-3 h-3 mr-1" />
          {trend}
        </span>
      </div>

      <h3 className="text-text-muted text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-xs text-text-muted mt-2">{subtitle}</p>

      {/* Barre de progression */}
      <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div 
          className={clsx("h-full rounded-full transition-all duration-1000 ease-out", theme.bar)} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}