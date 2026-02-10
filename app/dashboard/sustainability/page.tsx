'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { CloudOff, Fuel, Zap, Calendar, Download, Trees, DollarSign, Timer, Award } from 'lucide-react';
import { MetricCard } from '@/src/components/features/sustainability/MetricCard';
import { Skeleton } from '@/src/components/loading';

const GreenMap = dynamic(
  () => import('@/src/components/features/sustainability/GreenMap').then((m) => ({ default: m.GreenMap })),
  { loading: () => <Skeleton className="h-full min-h-[400px] w-full rounded-xl" />, ssr: false }
);

const OptimizedRouteList = dynamic(
  () => import('@/src/components/features/sustainability/OptimizedRouteList').then((m) => ({ default: m.OptimizedRouteList })),
  { loading: () => <Skeleton className="h-full min-h-[400px] w-full rounded-xl" />, ssr: false }
);

export default function SustainabilityPage() {
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
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primaryHover text-background transition-colors text-sm font-bold shadow-lg shadow-primary/20">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* 2. Metrics Grid (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Émissions CO2 Évitées" 
          value="1,240 T" 
          subtitle="Objectif: 1,000 Tonnes" 
          trend="+12%" 
          progress={110} 
          icon={CloudOff} 
          color="emerald" 
        />
        <MetricCard 
          title="Gains Efficacité Carburant" 
          value="18.5%" 
          subtitle="Moy: 32 L/100km flotte" 
          trend="+5%" 
          progress={65} 
          icon={Fuel} 
          color="blue" 
        />
        <MetricCard 
          title="Ratio Utilisation V.E." 
          value="42%" 
          subtitle="58 Véhicules actifs" 
          trend="+8%" 
          progress={42} 
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
        <BannerStat icon={Trees} label="Arbres Équivalents" value="15,400" />
        <BannerStat icon={DollarSign} label="Économies Réalisées" value="42,500 €" />
        <BannerStat icon={Timer} label="Temps Gagné" value="340 h" />
        <BannerStat icon={Award} label="Eco Score" value="94/100" />
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