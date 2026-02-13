'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { CloudOff, Fuel, Zap, Calendar, Download, Trees, DollarSign, Timer, Award } from 'lucide-react';
import { downloadExport } from '@/utils/downloadExport';
import { MetricCard } from '@/src/components/features/sustainability/MetricCard';
import { Skeleton } from '@/src/components/loading';

type SustainabilityMetric = {
  period: string;
  co2AvoidedTonnes: number | null;
  co2TargetTonnes: number | null;
  fuelEfficiencyPct: number | null;
  fleetAvgLPer100km: number | null;
  evUsagePct: number | null;
  evActiveCount: number | null;
  treesEquivalent: number | null;
  savingsEur: number | null;
  timeSavedHours: number | null;
  ecoScore: number | null;
  createdAt: string;
};

const GreenMap = dynamic(
  () => import('@/src/components/features/sustainability/GreenMap').then((m) => ({ default: m.GreenMap })),
  { loading: () => <Skeleton className="h-full min-h-[400px] w-full rounded-xl" />, ssr: false }
);

const OptimizedRouteList = dynamic(
  () => import('@/src/components/features/sustainability/OptimizedRouteList').then((m) => ({ default: m.OptimizedRouteList })),
  { loading: () => <Skeleton className="h-full min-h-[400px] w-full rounded-xl" />, ssr: false }
);

export default function SustainabilityPage() {
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SustainabilityMetric[]>([]);

  useEffect(() => {
    fetch('/api/sustainability-metrics', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMetrics(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const { latest, prev } = useMemo(() => {
    return { latest: metrics[0] ?? null, prev: metrics[1] ?? null };
  }, [metrics]);

  function formatNumber(n: number | null | undefined, digits = 0): string {
    if (n == null || Number.isNaN(Number(n))) return '—';
    return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: digits });
  }

  function trendPct(curr: number | null | undefined, prevVal: number | null | undefined): string {
    if (curr == null || prevVal == null || prevVal === 0) return '—';
    const diff = ((curr - prevVal) / Math.abs(prevVal)) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(0)}%`;
  }

  const co2Avoided = latest?.co2AvoidedTonnes ?? null;
  const co2Target = latest?.co2TargetTonnes ?? null;
  const co2Progress = co2Avoided != null && co2Target != null && co2Target > 0 ? Math.round((co2Avoided / co2Target) * 100) : 0;

  const fuelEff = latest?.fuelEfficiencyPct ?? null;
  const evUsage = latest?.evUsagePct ?? null;

  const handleExport = async () => {
    setExporting(true);
    await downloadExport('/api/export/sustainability?format=csv', 'impact_ecologique.csv');
    setExporting(false);
  };
  return (
    <div className="max-w-[1440px] mx-auto w-full space-y-8 pb-8">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-main">Rapport d'Impact</h1>
          <p className="text-text-muted text-lg max-w-2xl">
            Visualisation temps réel de l'efficacité environnementale et de la réduction carbone de votre flotte.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-border transition-colors text-sm font-medium text-text-main">
            <Calendar className="w-4 h-4" />
            Ce Mois
          </button>
          <button type="button" onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primaryHover text-background transition-colors text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-70">
            <Download className="w-4 h-4" />
            {exporting ? 'Export...' : 'Exporter'}
          </button>
        </div>
      </div>

      {/* 2. Metrics Grid (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Émissions CO2 Évitées" 
          value={loading ? '…' : `${formatNumber(co2Avoided, 2)} T`} 
          subtitle={loading ? 'Chargement…' : `Objectif: ${formatNumber(co2Target, 2)} Tonnes`} 
          trend={loading ? '—' : trendPct(co2Avoided ?? null, prev?.co2AvoidedTonnes ?? null)} 
          progress={loading ? 0 : Math.max(0, Math.min(200, co2Progress))} 
          icon={CloudOff} 
          color="emerald" 
        />
        <MetricCard 
          title="Gains Efficacité Carburant" 
          value={loading ? '…' : `${formatNumber(fuelEff, 1)}%`} 
          subtitle={loading ? 'Chargement…' : `Moy: ${formatNumber(latest?.fleetAvgLPer100km ?? null, 1)} L/100km flotte`} 
          trend={loading ? '—' : trendPct(fuelEff ?? null, prev?.fuelEfficiencyPct ?? null)} 
          progress={loading ? 0 : Math.max(0, Math.min(200, Math.round(fuelEff ?? 0)))} 
          icon={Fuel} 
          color="blue" 
        />
        <MetricCard 
          title="Ratio Utilisation V.E." 
          value={loading ? '…' : `${formatNumber(evUsage, 0)}%`} 
          subtitle={loading ? 'Chargement…' : `${formatNumber(latest?.evActiveCount ?? null, 0)} Véhicules actifs`} 
          trend={loading ? '—' : trendPct(evUsage ?? null, prev?.evUsagePct ?? null)} 
          progress={loading ? 0 : Math.max(0, Math.min(100, Math.round(evUsage ?? 0)))} 
          icon={Zap} 
          color="amber" 
        />
      </div>

      {/* 3. Main Split View (Map & List) - Streaming avec Suspense */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[500px]">
        <div className="lg:col-span-2 h-full">
          <Suspense fallback={<Skeleton className="h-full min-h-[400px] w-full rounded-xl" />}>
            <GreenMap />
          </Suspense>
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
          <Suspense fallback={<Skeleton className="h-full min-h-[400px] w-full rounded-xl" />}>
            <OptimizedRouteList />
          </Suspense>
        </div>
      </div>

      {/* 4. Footer Impact Banner */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-primary/10 rounded-2xl border border-primary/20">
        <BannerStat icon={Trees} label="Arbres Équivalents" value={loading ? '…' : formatNumber(latest?.treesEquivalent ?? null, 0)} />
        <BannerStat icon={DollarSign} label="Économies Réalisées" value={loading ? '…' : `${formatNumber(latest?.savingsEur ?? null, 0)} €`} />
        <BannerStat icon={Timer} label="Temps Gagné" value={loading ? '…' : `${formatNumber(latest?.timeSavedHours ?? null, 0)} h`} />
        <BannerStat icon={Award} label="Eco Score" value={loading ? '…' : `${formatNumber(latest?.ecoScore ?? null, 0)}/100`} />
      </div>

    </div>
  );
}

// Petit composant helper pour le footer
function BannerStat({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/20 text-primary rounded-full">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-text-muted font-medium">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  );
}