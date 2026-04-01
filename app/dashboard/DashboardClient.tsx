'use client'

import { ArrowUpRight, ArrowDownRight, Activity, Battery, Zap, PackageCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStatusColor } from '@/utils/getColorStatus'
import { useState, useEffect, useMemo } from 'react'
import { DateRangePicker, dateRangeQuery } from '@/src/components/ui/date-range-picker'
import type { RecentDelivery, DashboardStats } from '@/utils/types'
import { computeDashboardStatsFromDeliveries } from '@/utils/deliveryStatus'
import {ChartDelivery} from '@/utils/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'


function getAllDaysBetween(fromYmd: string, toYmd: string): string[] {
  const days: string[] = []
  const start = new Date(fromYmd)
  const end = new Date(toYmd)
  const d = new Date(start)
  d.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  while (d <= end) {
    days.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function formatDateDDMMYYYY(ymd: string): string {
  const [y, m, d] = ymd.split('-')
  return `${d}-${m}-${y}`
}

function buildChartData(deliveries: ChartDelivery[], fromYmd: string, toYmd: string) {
  const byDay = new Map<string, { livraisons: number; revenu: number; co2: number }>()
  deliveries.forEach((d) => {
    const day = d.createdAt.slice(0, 10)
    const entry = byDay.get(day) ?? { livraisons: 0, revenu: 0, co2: 0 }
    entry.livraisons += 1
    if (d.status === 'COMPLETED') {
      entry.revenu += Number(d.amount) || 0
      entry.co2 += 0.5
    }
    byDay.set(day, entry)
  })
  const days = getAllDaysBetween(fromYmd, toYmd)
  return days.map((date) => ({
    date,
    Livraisons: byDay.get(date)?.livraisons ?? 0,
    Revenu: Math.round(byDay.get(date)?.revenu ?? 0),
    'CO₂ (kg)': Math.round((byDay.get(date)?.co2 ?? 0) * 10) / 10,
  }))
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-lg border px-4 py-3 shadow-lg text-sm bg-[var(--color-surface-raised)] border-[var(--color-border-2)] text-[var(--text-main)]">
      <p className="font-bold border-b border-border pb-1.5 mb-2">{formatDateDDMMYYYY(label)}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.name} className="flex justify-between gap-4">
            <span className="text-text-muted">{entry.name}</span>
            <span className="font-semibold">
              {entry.name === 'Revenu' ? `${Number(entry.value).toLocaleString('fr-FR')} CFA` : entry.name === 'CO₂ (kg)' ? `${entry.value} kg` : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  LOADING: 'Chargement',
  TRANSIT: 'En cours',
  DELAYED: 'Retardé',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  EXPIRED: 'Livraison expirée',
}

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
  initialFrom,
  initialTo,
  companyCreatedAt,
  initialChartDeliveries,
  chartFrom,
  chartTo,
}: {
  initialRecentDeliveries: RecentDelivery[]
  initialStats: DashboardStats
  initialFrom: string | null
  initialTo: string | null
  companyCreatedAt: string
  initialChartDeliveries: ChartDelivery[]
  chartFrom: string
  chartTo: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>(initialRecentDeliveries || [])
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [chartDeliveries, setChartDeliveries] = useState<ChartDelivery[]>(initialChartDeliveries)
  const [chartRange, setChartRange] = useState({ from: chartFrom, to: chartTo })
  const [isLoadingRecent, setIsLoadingRecent] = useState(false)
  const range = useMemo(() => dateRangeQuery.parse(searchParams), [searchParams])

  const chartData = useMemo(
    () => buildChartData(chartDeliveries, chartRange.from, chartRange.to),
    [chartDeliveries, chartRange.from, chartRange.to]
  )

  // Filtrage : met à jour stats, livraisons récentes et données graphe
  useEffect(() => {
    const currentFrom = searchParams.get('from')
    const currentTo = searchParams.get('to')
    const from = currentFrom ?? companyCreatedAt
    const to = currentTo ?? new Date().toISOString().slice(0, 10)

    if (currentFrom || currentTo) {
      const fetchFiltered = async () => {
        setIsLoadingRecent(true)
        try {
          const params = new URLSearchParams()
          params.set('from', currentFrom ?? companyCreatedAt)
          params.set('to', currentTo ?? to)

          const response = await fetch(`/api/deliveries?${params.toString()}`)
          if (!response.ok) throw new Error('Erreur lors du filtrage')

          const data = await response.json()
          const deliveries = Array.isArray(data) ? data : (data?.deliveries ?? [])

          setRecentDeliveries(deliveries.slice(0, 10))

          setStats(
            computeDashboardStatsFromDeliveries(deliveries, initialStats, {
              from: currentFrom,
              to: currentTo,
            })
          )

          setChartDeliveries(
            deliveries.map((d: { createdAt: string | Date; status: string; amount: number | null }) => ({
              createdAt: typeof d.createdAt === 'string' ? d.createdAt : (d.createdAt as Date)?.toISOString?.() ?? '',
              status: d.status,
              amount: d.amount,
            }))
          )
          setChartRange({
            from: currentFrom ?? companyCreatedAt,
            to: currentTo ?? to,
          })
        } catch (error) {
          console.error('Erreur fetch filtré dashboard :', error)
          setRecentDeliveries(initialRecentDeliveries || [])
          setStats(initialStats)
          setChartDeliveries(initialChartDeliveries)
          setChartRange({ from: chartFrom, to: chartTo })
        } finally {
          setIsLoadingRecent(false)
        }
      }
      fetchFiltered()
    } else {
      setRecentDeliveries(initialRecentDeliveries || [])
      setStats(initialStats)
      setChartDeliveries(initialChartDeliveries)
      setChartRange({ from: chartFrom, to: chartTo })
      setIsLoadingRecent(false)
    }
  }, [searchParams, initialFrom, initialTo, initialRecentDeliveries, initialStats, initialChartDeliveries, chartFrom, chartTo, companyCreatedAt])

  return (
    <div className="space-y-8">
      <div className="md:flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Tableau de bord</h1>
          <p className="text-text-muted mt-1">Bienvenue, voici l'état de votre flotte en temps réel.</p>
        </div>
        <div className="flex space-x-4 items-center justify-between md:justify-normal mt-10 md:mt-0">
          <div className="w-[280px]">
            <DateRangePicker
              label=""
              value={range}
              minDate={new Date(companyCreatedAt)}
              maxDate={new Date()}
              onChange={(next) => {
                const sp = new URLSearchParams(searchParams.toString())
                sp.delete('from')
                sp.delete('to')
                const q = dateRangeQuery.toQuery(next)
                Object.entries(q).forEach(([k, v]) => sp.set(k, v))
                const qs = sp.toString()
                router.push(qs ? `/dashboard?${qs}` : '/dashboard')
              }}
            />
          </div>

          <Link href="/dashboard/deliveries/new" className="flex items-center bg-primary hover:bg-primaryHover text-background px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20">
            <Plus /> <span className="hidden md:block">Nouvelle Livraison</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Livraisons Actives" value={String(stats.activeDeliveries)} change={stats.completedThisMonth > 0 ? `${stats.completedThisMonth} terminées` : '—'} trend="up" icon={PackageCheck} />
        <StatCard title="Économie CO2 (kg)" value={String(stats.co2SavedKg)} change="—" trend="up" icon={Zap} />
        <StatCard title="Flotte Disponible" value={`${stats.fleetActive}/${stats.fleetTotal}`} change={`${stats.fleetTotal - stats.fleetActive} indisponibles`} trend={stats.fleetActive < stats.fleetTotal ? 'down' : 'up'} icon={Battery} />
        <StatCard title="Revenu (période)" value={`${Math.round(stats.totalRevenue).toLocaleString('fr-FR')} CFA`} change="—" trend="up" icon={Activity} />
      </div>

      {/* Graphe : toujours visible, 3 courbes (Livraisons, Revenu, CO₂), données = stats */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-text-main mb-6">Évolution des performances</h2>
        <div className="h-[70vh] max-h-[400px] min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-3)" />
              <XAxis dataKey="date" stroke="var(--color-text-3)" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v).getDate().toString()} />
              <YAxis width={50} stroke="var(--color-text-3)" tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-border-2)' }} />
              <Legend />
              <Line type="monotone" dataKey="Livraisons" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Revenu" stroke="var(--color-chart-3)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="CO₂ (kg)" stroke="var(--color-chart-4)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-main mb-6">Livraisons Récentes</h2>
          <div className="overflow-x-auto">
            {isLoadingRecent ? (
              <div className="py-12 text-center text-text-muted animate-pulse">
                Chargement...
                <div className="mt-8 space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 bg-border/40 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ) : recentDeliveries.length === 0 ? (
              <div className="py-12 text-center text-text-muted">
                Aucune livraison récente dans cette période
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-text-muted border-b border-border">
                    <th className="pb-4 font-medium">ID Course</th>
                    <th className="pb-4 font-medium">Chauffeur</th>
                    <th className="pb-4 font-medium">Statut</th>
                    <th className="pb-4 font-medium">Montant</th>
                    <th className="pb-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeliveries.map((d) => (
                    <tr key={d.id} className="group hover:bg-border/50 transition-colors">
                      <td className="py-4 font-mono text-text-muted">#{d.trackingId}</td>
                      <td className="py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-border overflow-hidden">
                          {d.driver?.avatarUrl ? (
                            <img src={d.driver.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center h-full text-xs font-bold text-text-muted">
                              {(d.driver?.name ?? '?').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-text-main font-medium">{d.driver?.name ?? '—'}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(STATUS_LABELS[d.status] ?? d.status)}`}>
                          {STATUS_LABELS[d.status] ?? d.status}
                        </span>
                      </td>
                      <td className="py-4 text-text-main">
                        {d.amount != null ? `${d.amount} ${d.currency}` : '—'}
                      </td>
                      <td className="py-4 text-right">
                        <Link href="/dashboard/deliveries" className="text-primary hover:text-text-main">
                          Détails
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}