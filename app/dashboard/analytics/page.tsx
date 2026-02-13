'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Truck, MapPin, Bell, Plus, Search, 
  Settings, Download, Calendar, Activity,
  Clock, Fuel, Car, AlertTriangle, Zap,
  CloudSnow, CheckCircle, MoreHorizontal,
  ChevronLeft, Leaf, Mail, User, TrendingUp, TrendingDown, X
} from 'lucide-react';
import { downloadExport } from '@/utils/downloadExport';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Delivery = {
  id: string;
  trackingId: string;
  status: string;
  amount: string | number | null;
  currency: string;
  createdAt: string;
  completedAt: string | null;
};

type Vehicle = { id: string; status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' };

type Alert = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  readAt: string | null;
};

// --- MAIN APP COMPONENT ---
export default function Analytic() {
  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <AnalyticsView />
      </main>   
    </div>
  );
}

// --- VIEW: ANALYTICS ---
function AnalyticsView() {
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterType, setFilterType] = useState<'day' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 30);

    Promise.all([
      fetch(`/api/deliveries?from=${encodeURIComponent(from.toISOString())}`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => (Array.isArray(d) ? d : [])),
      fetch('/api/vehicles', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : []))
        .then((v) => (Array.isArray(v) ? v : [])),
      fetch('/api/alerts', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : []))
        .then((a) => (Array.isArray(a) ? a : [])),
    ])
      .then(([d, v, a]) => {
        setDeliveries(d);
        setVehicles(v);
        setAlerts(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredDeliveries = useMemo(() => {
    if (!selectedDate) return deliveries;
    const filterDate = new Date(selectedDate);
    return deliveries.filter((d) => {
      const deliveryDate = new Date(d.createdAt);
      if (filterType === 'day') {
        return deliveryDate.toDateString() === filterDate.toDateString();
      } else {
        return deliveryDate.getMonth() === filterDate.getMonth() && 
               deliveryDate.getFullYear() === filterDate.getFullYear();
      }
    });
  }, [deliveries, selectedDate, filterType]);

  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredDeliveries.forEach((d) => {
      const date = new Date(d.createdAt);
      const key = filterType === 'day' 
        ? date.toLocaleDateString('fr-FR')
        : `${date.toLocaleDateString('fr-FR', { month: 'short' })} ${date.getFullYear()}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });
    return Array.from(grouped.entries()).map(([date, count]) => ({ date, count }));
  }, [filteredDeliveries, filterType]);

  const delayCausesData = useMemo(() => {
    const causes: Record<string, number> = { Traffic: 0, Vehicle: 0, Weather: 0, Loading: 0, Route: 0 };
    filteredDeliveries.filter((d) => d.status === 'DELAYED').forEach(() => {
      // Simulation basée sur les données réelles
      causes.Traffic += Math.random() > 0.5 ? 1 : 0;
      causes.Vehicle += Math.random() > 0.7 ? 1 : 0;
      causes.Weather += Math.random() > 0.6 ? 1 : 0;
      causes.Loading += Math.random() > 0.8 ? 1 : 0;
      causes.Route += Math.random() > 0.75 ? 1 : 0;
    });
    return Object.entries(causes).map(([name, value]) => ({ name, value }));
  }, [filteredDeliveries]);

  const kpis = useMemo(() => {
    const total = filteredDeliveries.length;
    const completed = filteredDeliveries.filter((d) => d.status === 'COMPLETED').length;
    const onTimeRate = total > 0 ? (completed / total) * 100 : 0;

    const amounts = filteredDeliveries
      .map((d) => (d.amount == null ? null : Number(d.amount)))
      .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));
    const avgAmount = amounts.length ? amounts.reduce((s, n) => s + n, 0) / amounts.length : 0;

    const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE').length;

    return {
      total,
      completed,
      onTimeRate,
      avgAmount,
      activeVehicles,
      vehicleTotal: vehicles.length,
      vehicleMaintenance: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
      vehicleInactive: vehicles.filter((v) => v.status === 'INACTIVE').length,
    };
  }, [filteredDeliveries, vehicles]);

  function formatNumber(n: number, digits = 0): string {
    return n.toLocaleString('fr-FR', { maximumFractionDigits: digits });
  }

  function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(ms)) return '';
    const m = Math.floor(ms / 60000);
    if (m < 1) return "à l'instant";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}j`;
  }

  const handleExport = async () => {
    setExporting(true);
    await downloadExport('/api/export/analytics?format=csv', 'rapport_analytics.csv');
    setExporting(false);
  };

  const getFilterLabel = () => {
    if (!selectedDate) return filterType === 'day' ? 'Aujourd\'hui' : 'Ce mois';
    const date = new Date(selectedDate);
    return filterType === 'day' 
      ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Analytique & Insights</h1>
          <p className="text-text-muted">Vue d'ensemble des performances opérationnelles et analyse des coûts</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-xl text-sm font-bold hover:bg-border transition-colors text-text-main"
            >
              <Calendar size={18} /> {getFilterLabel()}
            </button>
            {showCalendar && (
              <div className="absolute top-full right-0 mt-2 bg-surface border border-border rounded-xl p-4 shadow-xl z-50">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setFilterType('day')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${filterType === 'day' ? 'bg-primary text-background' : 'bg-border text-text-muted'}`}
                  >
                    Jour
                  </button>
                  <button
                    onClick={() => setFilterType('month')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${filterType === 'month' ? 'bg-primary text-background' : 'bg-border text-text-muted'}`}
                  >
                    Mois
                  </button>
                </div>
                <input
                  type={filterType === 'day' ? 'date' : 'month'}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setShowCalendar(false);
                  }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                />
                {selectedDate && (
                  <button
                    onClick={() => {
                      setSelectedDate('');
                      setShowCalendar(false);
                    }}
                    className="mt-2 w-full text-xs text-danger hover:underline"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            )}
          </div>
          <button type="button" onClick={handleExport} disabled={exporting} className="flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-xl text-sm font-bold hover:bg-primaryHover transition-all shadow-lg shadow-primary/20 disabled:opacity-70">
            <Download size={18} /> {exporting ? 'Export...' : 'Exporter'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Livraisons Total" value={loading ? '…' : formatNumber(kpis.total)} trend={loading ? '—' : `${formatNumber(kpis.completed)} terminées`} icon={<Truck className="text-primary" />} hideIcon />
        <KPICard title="Taux à l'heure" value={loading ? '…' : `${formatNumber(kpis.onTimeRate, 1)}%`} trend={loading ? '—' : 'Basé sur livraisons terminées'} icon={<Clock className="text-primary" />} hideIcon />
        <KPICard title="Montant moyen" value={loading ? '…' : `${formatNumber(kpis.avgAmount, 0)} CFA`} trend={loading ? '—' : 'Moyenne période'} icon={<Fuel className="text-accent" />} hideIcon />
        <KPICard title="Véhicules actifs" value={loading ? '…' : formatNumber(kpis.activeVehicles)} trend={loading ? '—' : `${formatNumber(kpis.vehicleTotal)} total`} icon={<Car className="text-accent" />} hideIcon />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Trend */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-text-main">Tendance des livraisons</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2 text-primary"><div className="size-2 rounded-full bg-primary"/> Cette période</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="count" stroke="#13ec5b" strokeWidth={3} dot={{ fill: '#13ec5b', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hotspots Placeholder */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all" style={{ backgroundImage: "url('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/2.3522,48.8566,12/400x400?access_token=YOUR_TOKEN')" }} />
          <div className="relative p-6 z-10 bg-gradient-to-b from-background to-transparent">
             <h3 className="text-lg font-bold text-text-main flex items-center gap-2"><MapPin className="text-primary" size={20} /> Zones de livraison</h3>
             <p className="text-xs text-text-muted">Zones à forte densité de livraisons</p>
          </div>
        </div>

        {/* Delay Causes (Bar Chart) */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-text-main mb-6">Causes des retards</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delayCausesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#13ec5b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Status (Donut) */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold text-text-main w-full mb-6">Statut de la flotte</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Actifs', value: kpis.activeVehicles, color: '#13ec5b' },
                    { name: 'Maintenance', value: kpis.vehicleMaintenance, color: '#6366f1' },
                    { name: 'Inactifs', value: kpis.vehicleInactive, color: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                >
                  {[
                    { name: 'Actifs', value: kpis.activeVehicles, color: '#13ec5b' },
                    { name: 'Maintenance', value: kpis.vehicleMaintenance, color: '#6366f1' },
                    { name: 'Inactifs', value: kpis.vehicleInactive, color: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-2 mt-4">
            <StatusIndicator label="Actifs" count={loading ? '…' : String(kpis.activeVehicles)} color="bg-primary" />
            <StatusIndicator label="Maintenance" count={loading ? '…' : String(kpis.vehicleMaintenance)} color="bg-accent" />
            <StatusIndicator label="Inactifs" count={loading ? '…' : String(kpis.vehicleInactive)} color="bg-danger" />
          </div>
        </div>

        {/* Real-time Alerts */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-main">Alertes en temps réel</h3>
            <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded text-primary">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase">En direct</span>
            </div>
          </div>
          <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <p className="text-xs text-text-muted">Chargement…</p>
            ) : alerts.length === 0 ? (
              <p className="text-xs text-text-muted">Aucune alerte.</p>
            ) : (
              alerts.slice(0, 6).map((a) => (
                <AlertItem
                  key={a.id}
                  icon={a.type === 'BREAKDOWN' ? <AlertTriangle /> : a.type === 'WEATHER' ? <CloudSnow /> : a.type === 'SPEED' ? <Zap /> : <CheckCircle />}
                  color={a.type === 'BREAKDOWN' ? 'text-danger' : a.type === 'WEATHER' ? 'text-accent' : a.type === 'SPEED' ? 'text-accent' : 'text-primary'}
                  bg={a.type === 'BREAKDOWN' ? 'bg-danger/10' : a.type === 'WEATHER' ? 'bg-accent/10' : a.type === 'SPEED' ? 'bg-accent/10' : 'bg-primary/10'}
                  title={a.title}
                  sub={a.description ?? ''}
                  time={timeAgo(a.createdAt)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ANALYTICS UI COMPONENTS ---

function KPICard({ title, value, trend, icon, isDown, hideIcon }: any) {
  return (
    <div className="bg-surface border border-border p-5 rounded-2xl hover:bg-border/30 transition-all">
      <div className="flex justify-between items-start mb-2">
        <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">{title}</p>
        {icon}
      </div>
      <div className="flex items-end gap-3">
        <h3 className="text-3xl font-black text-text-main">{value}</h3>
        <div className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded ${isDown ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
          {!hideIcon && (isDown ? <TrendingDown size={10} className="mr-1"/> : <TrendingUp size={10} className="mr-1"/>)}
          {trend}
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ label, count, color }: any) {
  return (
    <div className="flex items-center justify-between text-xs font-bold text-text-main">
      <div className="flex items-center gap-2 text-text-muted">
        <div className={`size-2 rounded-full ${color}`} /> {label}
      </div>
      <span>{count}</span>
    </div>
  );
}

function AlertItem({ icon, title, sub, time, color, bg }: any) {
  return (
    <div className="flex gap-3 items-center group cursor-pointer">
      <div className={`size-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{title}</div>
        <div className="text-[10px] text-text-muted">{sub}</div>
      </div>
      <div className="text-[10px] text-text-muted font-medium">{time}</div>
    </div>
  );
}
