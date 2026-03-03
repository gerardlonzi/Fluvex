'use client'

import { ArrowUpRight, ArrowDownRight, Activity, Battery, Zap, PackageCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { RecentDelivery, DashboardStats } from '@/utils/types'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  LOADING: 'Chargement',
  TRANSIT: 'En cours',
  DELAYED: 'Retardé',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
}

function getMonthOptions() {
  const opts: { label: string; value: string }[] = [{ label: 'Ce mois', value: '' }]
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    opts.push({
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  return opts
}
const MONTH_OPTIONS = getMonthOptions()

function StatCard({ title, value, change, trend, icon: Icon }: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
}) {
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
  )
}

export default function DashboardClient({
  initialRecentDeliveries,
  initialStats,
}: {
  initialRecentDeliveries: RecentDelivery[]
  initialStats: DashboardStats
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const monthParam = searchParams.get('month') ?? ''

  const handleMonthChange = (value: string) => {
    const url = value ? `/dashboard?month=${encodeURIComponent(value)}` : '/dashboard'
    router.push(url)
  }

  const stats = initialStats
  const recentDeliveries = initialRecentDeliveries

  return (
    <div className="space-y-8 my-16 md:my-0">
      <div className="md:flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Tableau de bord</h1>
          <p className="text-text-muted mt-1">Bienvenue, voici l'état de votre flotte en temps réel.</p>
        </div>
        <div className="flex space-x-4 items-center justify-between md:justify-normal mt-10 md:mt-0">
          <select
            value={monthParam}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-border transition-colors text-sm font-medium text-text-main cursor-pointer"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value || 'current'} value={m.value}>{m.label}</option>
            ))}
          </select>
          <Link href="/dashboard/deliveries/new" className="flex items-center bg-primary hover:bg-primaryHover text-background px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20">
            <Plus /> <span className="hidden md:block">Nouvelle Livraison</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Livraisons Actives"
          value={String(stats.activeDeliveries)}
          change={stats.completedThisMonth > 0 ? `${stats.completedThisMonth} terminées` : '—'}
          trend="up"
          icon={PackageCheck}
        />
        <StatCard
          title="Économie CO2 (kg)"
          value={String(stats.co2SavedKg)}
          change="—"
          trend="up"
          icon={Zap}
        />
        <StatCard
          title="Flotte Disponible"
          value={`${stats.fleetActive}/${stats.fleetTotal}`}
          change={`${stats.fleetTotal - stats.fleetActive} indisponibles`}
          trend={stats.fleetActive < stats.fleetTotal ? 'down' : 'up'}
          icon={Battery}
        />
        <StatCard
          title="Revenu (période)"
          value={`${Math.round(stats.totalRevenue).toLocaleString('fr-FR')} CFA`}
          change="—"
          trend="up"
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-main mb-6">Livraisons Récentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left w-[600px] md:w-full">
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
                        <div className="w-8 h-8 rounded-full bg-border overflow-hidden">
                          {d.driver && (d.driver as { avatarUrl?: string }).avatarUrl ? (
                            <img src={(d.driver as { avatarUrl: string }).avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-text-muted text-xs font-bold">
                              {(d.driver?.name ?? '—').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
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

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-main mb-4">Aperçu Zone</h2>
          <div className="h-64 bg-border rounded-xl flex items-center justify-center text-text-muted mb-4">
            [Intégration Mapbox Mini]
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-border/50 rounded-lg border border-border">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-sm text-text-muted">Zone A: Trafic fluide</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-border/50 rounded-lg border border-border">
              <div className="w-2 h-2 rounded-full bg-danger" />
              <p className="text-sm text-text-muted">Zone B: Ralentissements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
