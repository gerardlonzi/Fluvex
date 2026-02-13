'use client';

import {
  ArrowUpRight, ArrowDownRight, Activity, Battery, Zap, Calendar, X,
  Bell, Settings, AlertTriangle, UserCheck, Clock, CheckCircle2, Server,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

type RecentDelivery = { id: string; trackingId: string; driver?: { name: string }; status: string; amount: unknown; currency: string };
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', LOADING: 'Chargement', TRANSIT: 'En cours', DELAYED: 'Retardé',
  COMPLETED: 'Terminée', CANCELLED: 'Annulée',
};

// Composant "Atome" pour les cartes de stats
function StatCard({ title, value, change, trend, icon: Icon }: any) {
  return (
    <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-border rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'text-primary bg-primary/10' : 'text-danger bg-danger/10'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {change}
        </span>
      </div>
      <h3 className="text-text-muted text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-text-main">{value}</p>
    </div>
  );
}

type AlertItem = { id: string; type: string; title: string; description: string | null; readAt: string | null; createdAt: string };

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const loadAlerts = (unreadOnly: boolean) => {
    const url = unreadOnly ? '/api/alerts?unreadOnly=true' : '/api/alerts';
    fetch(url, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AlertItem[]) => setAlerts(data));
  };

  useEffect(() => {
    if (isOpen) loadAlerts(false);
    else loadAlerts(true);
  }, [isOpen]);

  const unreadCount = alerts.filter((a) => !a.readAt).length;
  const badgeCount = unreadCount; // Toujours afficher le nombre de non lues
  const displayAlerts = notifTab === 'unread' ? alerts.filter((a) => !a.readAt) : alerts.slice(0, 20);

  const markAllRead = () => {
    const ids = alerts.filter((a) => !a.readAt).map((a) => a.id);
    if (ids.length === 0) return;
    setMarkingAll(true);
    Promise.all(ids.map((id) => fetch(`/api/alerts/${id}/read`, { method: 'PATCH', credentials: 'include' })))
      .then(() => loadAlerts(false))
      .finally(() => setMarkingAll(false));
  };

  const markOneRead = (id: string) => {
    fetch(`/api/alerts/${id}/read`, { method: 'PATCH', credentials: 'include' })
      .then(() => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, readAt: new Date().toISOString() } : a))));
  };

  return <>
  <button type="button" onClick={() => setIsOpen(true)} className="relative"><Bell className="w-6 h-6" />
    {badgeCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">{badgeCount}</span>}
  </button>
  {isOpen && (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-md h-full bg-[#0f172a] shadow-2xl border-l border-[#1e293b] flex flex-col">
        <div className="px-6 py-5 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#f8fafc]">Notifications</h2>
            <span className="bg-[#13ec5b]/10 text-[#13ec5b] text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} non lues</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={markAllRead} disabled={unreadCount === 0 || markingAll} className="text-sm font-medium text-[#13ec5b] hover:text-[#10b981] transition-colors disabled:opacity-50">
              {markingAll ? 'En cours…' : 'Tout marquer comme lu'}
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="text-[#94a3b8] hover:text-[#f8fafc]"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-[#1e293b] bg-[#0f172a]">
          <div className="flex space-x-1 bg-[#020617] p-1 rounded-lg w-max border border-[#1e293b]">
            <button type="button" onClick={() => setNotifTab('all')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${notifTab === 'all' ? 'bg-[#1e293b] text-[#f8fafc]' : 'text-[#94a3b8] hover:text-[#f8fafc]'}`}>Toutes</button>
            <button type="button" onClick={() => setNotifTab('unread')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${notifTab === 'unread' ? 'bg-[#1e293b] text-[#f8fafc]' : 'text-[#94a3b8] hover:text-[#f8fafc]'}`}>Non lues</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayAlerts.length === 0 ? (
            <p className="text-sm text-[#94a3b8] p-4">Aucune alerte.</p>
          ) : (
            displayAlerts.map((alert) => (
              <button key={alert.id} type="button" onClick={() => !alert.readAt && markOneRead(alert.id)} className={`w-full text-left group relative p-4 rounded-xl border transition-all ${!alert.readAt ? 'bg-[#ef4444]/5 border-[#ef4444]/20 hover:border-[#ef4444]/40' : 'bg-[#020617]/50 border-[#1e293b] opacity-75'}`}>
                {!alert.readAt && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#13ec5b] ring-4 ring-[#0f172a]" />}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444]">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-[#f8fafc]">{alert.title}</h4>
                      <span className="text-xs text-[#94a3b8]">{new Date(alert.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm text-[#94a3b8] leading-relaxed">{alert.description || '—'}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#1e293b] bg-[#020617]">
          <Link href="/dashboard/settings" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#0f172a] border border-[#1e293b] text-[#f8fafc] font-semibold rounded-xl hover:bg-[#1e293b] transition-all text-sm">
            <Settings className="w-4 h-4" />
            Paramètres de notification
          </Link>
        </div>
      </div>
    </div>
  )}
</>


}
type DashboardStats = {
  activeDeliveries: number;
  completedThisMonth: number;
  fleetTotal: number;
  fleetActive: number;
  co2SavedKg: number;
  totalRevenue: number;
  period: string;
};

function getMonthOptions() {
  const opts: { label: string; value: string }[] = [{ label: 'Ce mois', value: '' }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return opts;
}
const MONTH_OPTIONS = getMonthOptions();

export default function DashboardPage() {
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthFilter, setMonthFilter] = useState('');

  useEffect(() => {
    fetch('/api/deliveries', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RecentDelivery[]) => setRecentDeliveries(data.slice(0, 5)));
  }, []);

  useEffect(() => {
    const url = monthFilter ? `/api/dashboard/stats?month=${encodeURIComponent(monthFilter)}` : '/api/dashboard/stats';
    fetch(url, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats);
  }, [monthFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Tableau de bord</h1>
          <p className="text-text-muted mt-1">Bienvenue, voici l'état de votre flotte en temps réel.</p>
        </div>
        <div className="flex space-x-4 items-center">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-border transition-colors text-sm font-medium text-text-main cursor-pointer"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value || 'current'} value={m.value}>{m.label}</option>
            ))}
          </select>
          <Link href="/dashboard/deliveries/new" className="bg-primary hover:bg-primaryHover text-background px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20">
            + Nouvelle Livraison
          </Link>
          <NotificationBell />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Livraisons Actives"
          value={stats != null ? String(stats.activeDeliveries) : '—'}
          change={stats ? (stats.completedThisMonth > 0 ? `${stats.completedThisMonth} terminées` : '—') : '…'}
          trend="up"
          icon={Activity}
        />
        <StatCard
          title="Économie CO2 (kg)"
          value={stats != null ? String(stats.co2SavedKg) : '—'}
          change="—"
          trend="up"
          icon={Zap}
        />
        <StatCard
          title="Flotte Disponible"
          value={stats != null ? `${stats.fleetActive}/${stats.fleetTotal}` : '—'}
          change={stats ? `${stats.fleetTotal - stats.fleetActive} indisponibles` : '…'}
          trend={stats && stats.fleetActive < stats.fleetTotal ? 'down' : 'up'}
          icon={Battery}
        />
        <StatCard
          title="Revenu (période)"
          value={stats != null ? `${Math.round(stats.totalRevenue).toLocaleString('fr-FR')} CFA` : '—'}
          change="—"
          trend="up"
          icon={Activity}
        />
      </div>

      {/* Section : Activité Récente & Carte (Layout 2/3 + 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tableau des courses récentes */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-main mb-6">Livraisons Récentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-text-muted text-sm border-b border-border">
                  <th className="pb-4 font-medium">ID Course</th>
                  <th className="pb-4 font-medium">Chauffeur</th>
                  <th className="pb-4 font-medium">Statut</th>
                  <th className="pb-4 font-medium">Montant</th>
                  <th className="pb-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentDeliveries.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-text-muted">Aucune livraison récente.</td></tr>
                ) : (
                recentDeliveries.map((d) => (
                  <tr key={d.id} className="group hover:bg-border/50 transition-colors">
                    <td className="py-4 font-mono text-text-muted">#{d.trackingId}</td>
                    <td className="py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-border" />
                      <span className="text-text-main font-medium">{d.driver?.name ?? '—'}</span>
                    </td>
                    <td className="py-4">
                      <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold border border-accent/20">
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                    </td>
                    <td className="py-4 text-text-main">{d.amount != null ? `${d.amount} ${d.currency}` : '—'}</td>
                    <td className="py-4 text-right">
                      <Link href="/dashboard/deliveries" className="text-primary hover:text-text-main transition-colors">Détails</Link>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mini Map ou Notification Area */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-main mb-4">Aperçu Zone</h2>
          <div className="h-64 bg-border rounded-xl flex items-center justify-center text-text-muted mb-4">
            [Intégration Mapbox Mini]
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-3 bg-border/50 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <p className="text-sm text-text-muted">Zone A: Trafic fluide</p>
             </div>
             <div className="flex items-center gap-3 p-3 bg-border/50 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-danger"></div>
                <p className="text-sm text-text-muted">Zone B: Ralentissements</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
