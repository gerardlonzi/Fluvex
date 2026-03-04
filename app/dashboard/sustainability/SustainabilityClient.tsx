'use client'

import React, { useMemo, Suspense, lazy } from 'react'
import { Leaf, Download, TreePine, Fuel, Zap } from 'lucide-react'
import { MetricCard } from '@/src/components/features/sustainability/MetricCard'
import { downloadExport } from '@/utils/downloadExport'

export type SustainabilityMetricRow = {
  period: string
  co2AvoidedTonnes: number | null
  co2TargetTonnes: number | null
  fuelEfficiencyPct: number | null
  fleetAvgLPer100km: number | null
  evUsagePct: number | null
  evActiveCount: number | null
  treesEquivalent: number | null
  savingsEur: number | null
  timeSavedHours: number | null
  ecoScore: number | null
  createdAt: string
}

const GreenMap = lazy(() =>
  import('@/src/components/features/sustainability/GreenMap').then((m) => ({ default: m.GreenMap }))
)
const OptimizedRouteList = lazy(() =>
  import('@/src/components/features/sustainability/OptimizedRouteList').then((m) => ({ default: m.OptimizedRouteList }))
)

function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(decimals)} M`
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(decimals)} k`
  return value.toFixed(decimals)
}

function trendPct(current: number | null | undefined, previous: number | null | undefined): string {
  if (current == null || previous == null || previous === 0) return '—'
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function MapSkeleton() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="h-8 w-48 bg-border rounded animate-pulse" />
      <div className="flex-1 min-h-[400px] rounded-2xl border border-border bg-surface animate-pulse" />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="h-8 w-32 bg-border rounded animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-border rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export default function SustainabilityClient({
  initialMetrics,
}: {
  initialMetrics: SustainabilityMetricRow[]
}) {
  const latest = initialMetrics[0] ?? null
  const prev = initialMetrics[1] ?? null

  const handleExport = async () => {
    await downloadExport('/api/export/sustainability?format=csv', 'impact_ecologique.csv')
  }

  const co2Trend = useMemo(
    () => trendPct(latest?.co2AvoidedTonnes ?? null, prev?.co2AvoidedTonnes ?? null),
    [latest?.co2AvoidedTonnes, prev?.co2AvoidedTonnes]
  )
  const efficiencyTrend = useMemo(
    () => trendPct(latest?.fuelEfficiencyPct ?? null, prev?.fuelEfficiencyPct ?? null),
    [latest?.fuelEfficiencyPct, prev?.fuelEfficiencyPct]
  )
  const ecoTrend = useMemo(
    () => trendPct(latest?.ecoScore ?? null, prev?.ecoScore ?? null),
    [latest?.ecoScore, prev?.ecoScore]
  )

  const co2Progress = useMemo(() => {
    const avoided = latest?.co2AvoidedTonnes ?? 0
    const target = latest?.co2TargetTonnes ?? 1
    if (target <= 0) return 0
    return Math.min(100, (avoided / target) * 100)
  }, [latest?.co2AvoidedTonnes, latest?.co2TargetTonnes])

  const efficiencyProgress = Math.min(100, latest?.fuelEfficiencyPct ?? 0)
  const ecoProgress = Math.min(100, latest?.ecoScore ?? 0)

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
      <header className="border-b border-border bg-background/50 backdrop-blur-md md:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
              <Leaf className="w-7 h-7 text-primary" />
              Durabilité
            </h1>
            <p className="text-text-muted text-sm">Impact écologique et corridors verts.</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-[#020617] font-bold hover:bg-primaryHover transition-colors"
          >
            <Download size={18} />
            Exporter
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto md:p-6 overflow-y-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="CO₂ évité"
            value={latest ? `${formatNumber(latest.co2AvoidedTonnes)} t` : '—'}
            subtitle={latest?.period ? `Période ${latest.period}` : 'Aucune donnée'}
            trend={co2Trend}
            progress={co2Progress}
            icon={TreePine}
            color="emerald"
          />
          <MetricCard
            title="Efficacité carburant"
            value={latest ? `${formatNumber(latest.fuelEfficiencyPct)} %` : '—'}
            subtitle={
              latest?.fleetAvgLPer100km != null
                ? `Moy. flotte ${formatNumber(latest.fleetAvgLPer100km)} L/100km`
                : 'Moyenne flotte'
            }
            trend={efficiencyTrend}
            progress={efficiencyProgress}
            icon={Fuel}
            color="blue"
          />
          <MetricCard
            title="Score éco"
            value={latest?.ecoScore != null ? String(latest.ecoScore) : '—'}
            subtitle={
              latest?.evUsagePct != null
                ? `VE ${formatNumber(latest.evUsagePct)}% • ${latest.evActiveCount ?? 0} VE actifs`
                : 'Véhicules électriques'
            }
            trend={ecoTrend}
            progress={ecoProgress}
            icon={Zap}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<MapSkeleton />}>
            <GreenMap />
          </Suspense>
          <Suspense fallback={<ListSkeleton />}>
            <OptimizedRouteList />
          </Suspense>
        </div>

        <BannerStat
          co2AvoidedTonnes={latest?.co2AvoidedTonnes}
          treesEquivalent={latest?.treesEquivalent}
          savingsEur={latest?.savingsEur}
          timeSavedHours={latest?.timeSavedHours}
        />
      </main>
    </div>
  )
}

function BannerStat({
  co2AvoidedTonnes,
  treesEquivalent,
  savingsEur,
  timeSavedHours,
}: {
  co2AvoidedTonnes: number | null | undefined
  treesEquivalent: number | null | undefined
  savingsEur: number | null | undefined
  timeSavedHours: number | null | undefined
}) {
  const hasData =
    co2AvoidedTonnes != null ||
    treesEquivalent != null ||
    savingsEur != null ||
    timeSavedHours != null
  if (!hasData) return null
  return (
    <footer className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {co2AvoidedTonnes != null && (
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-black text-primary">{formatNumber(co2AvoidedTonnes)} t CO₂</p>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Évité cette période</p>
          </div>
        )}
        {treesEquivalent != null && (
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-black text-primary">{formatNumber(treesEquivalent, 0)}</p>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Arbres équivalent</p>
          </div>
        )}
        {savingsEur != null && (
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-black text-primary">{formatNumber(savingsEur)} €</p>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Économies</p>
          </div>
        )}
        {timeSavedHours != null && (
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-black text-primary">{formatNumber(timeSavedHours, 0)} h</p>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Temps gagné</p>
          </div>
        )}
      </div>
    </footer>
  )
}
