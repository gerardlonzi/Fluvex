'use client'

import React, { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart3, Download, TrendingUp, Truck, AlertTriangle,
  Bell, RefreshCw, Trash2, Gauge, CloudRain, Zap,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,  Legend,

  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { downloadExport } from '@/utils/downloadExport'
import { DateRangePicker, dateRangeQuery } from '@/src/components/ui/date-range-picker'

export type AnalyticsDelivery = {
  id: string
  trackingId: string
  status: string
  amount: number | null
  currency: string
  createdAt: string
  completedAt: string | null
}

export type AnalyticsVehicle = { id: string; status: string }

export type AnalyticsAlert = {
  id: string
  type: string
  title: string
  description: string | null
  createdAt: string
  readAt: string | null
}

const ALERT_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  NEW: { icon: Bell, color: 'text-primary', bg: 'bg-primary/10' },
  UPDATE: { icon: RefreshCw, color: 'text-accent', bg: 'bg-accent/10' },
  DELETE: { icon: Trash2, color: 'text-danger', bg: 'bg-danger/10' },
  BREAKDOWN: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
  SPEED: { icon: Gauge, color: 'text-accent', bg: 'bg-accent/10' },
  WEATHER: { icon: CloudRain, color: 'text-text-muted', bg: 'bg-border/30' },
  OPTIMIZATION: { icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
  OTHER: { icon: Bell, color: 'text-text-muted', bg: 'bg-border/30' },
}

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

function buildChartData(
  deliveries: { createdAt: string; status: string; amount: number | null }[],
  fromYmd: string,
  toYmd: string
) {
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

function timeAgo(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (sec < 60) return 'À l\'instant'
  if (sec < 3600) return `Il y a ${Math.floor(sec / 60)} min`
  if (sec < 86400) return `Il y a ${Math.floor(sec / 3600)} h`
  if (sec < 604800) return `Il y a ${Math.floor(sec / 86400)} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function KPICard({
  title,
  value,
  trend,
  icon: Icon,
}: {
  title: string
  value: string | number
  trend?: string
  icon: React.ElementType
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl p-5 border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm font-medium">{title}</p>
        <div className="bg-background p-2 rounded-lg border border-border">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-text-main">{value}</p>
      {trend != null && (
        <span className="text-sm font-bold text-primary">{trend}</span>
      )}
    </div>
  )
}

function StatusIndicator({ status }: { status: string }) {
  const labels: Record<string, string> = {
    ACTIVE: 'Actif',
    MAINTENANCE: 'Maintenance',
    INACTIVE: 'Inactif',
  }
  const colors: Record<string, string> = {
    ACTIVE: 'bg-primary',
    MAINTENANCE: 'bg-amber-500',
    INACTIVE: 'bg-text-muted',
  }
  const label = labels[status] ?? status
  const color = colors[status] ?? 'bg-text-muted'
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-main">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}

function AlertItem({
  alert,
  timeAgoLabel,
}: {
  alert: AnalyticsAlert
  timeAgoLabel: string
}) {
  const config = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.OTHER
  const Icon = config.icon
  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        alert.readAt ? 'border-border bg-surface/50 opacity-70' : 'border-primary/20 bg-surface'
      }`}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h4 className="text-sm font-bold text-text-main leading-tight truncate">{alert.title}</h4>
            <span className="text-[10px] font-medium text-text-muted whitespace-nowrap">{timeAgoLabel}</span>
          </div>
          <p className="text-xs text-text-muted line-clamp-2">{alert.description ?? '—'}</p>
        </div>
        {!alert.readAt && (
          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  )
}

function formatDateDDMMYYYY(ymd: string): string {
  const [y, m, d] = ymd.split('-')
  return `${d}-${m}-${y}`
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

export default function AnalyticsClient({
  initialDeliveries,
  initialVehicles,
  initialAlerts,
  initialFrom,
  initialTo,
  chartFrom,
  chartTo,
  companyCreatedAt,
}: {
  initialDeliveries: AnalyticsDelivery[]
  initialVehicles: AnalyticsVehicle[]
  initialAlerts: AnalyticsAlert[]
  initialFrom: string | null
  initialTo: string | null
  chartFrom: string
  chartTo: string
  companyCreatedAt?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Pas de date par défaut dans le picker (seulement via l'URL)
  const range = useMemo(() => dateRangeQuery.parse(searchParams), [searchParams])
  const [exporting, setExporting] = useState(false)

  const filteredDeliveries = initialDeliveries
  const chartData = useMemo(
    () => buildChartData(filteredDeliveries, chartFrom, chartTo),
    [filteredDeliveries, chartFrom, chartTo]
  )

  const delayCausesData = useMemo(() => {
    const byType = new Map<string, number>()
    initialAlerts.forEach((a) => {
      byType.set(a.type, (byType.get(a.type) ?? 0) + 1)
    })
    const labels: Record<string, string> = {
      BREAKDOWN: 'Panne',
      WEATHER: 'Météo',
      SPEED: 'Vitesse',
      UPDATE: 'Mise à jour',
      NEW: 'Nouveau',
      OPTIMIZATION: 'Optimisation',
      DELETE: 'Suppression',
      OTHER: 'Autre',
    }
    return Array.from(byType.entries()).map(([type, count]) => ({
      cause: labels[type] ?? type,
      count,
    }))
  }, [initialAlerts])

  const fleetPieData = useMemo(() => {
    const byStatus = new Map<string, number>()
    initialVehicles.forEach((v) => {
      byStatus.set(v.status, (byStatus.get(v.status) ?? 0) + 1)
    })
    const colors: Record<string, string> = {
      ACTIVE: '#13ec5b',
      MAINTENANCE: '#f59e0b',
      INACTIVE: '#94a3b8',
    }
    return Array.from(byStatus.entries()).map(([status, count]) => ({
      name: status === 'ACTIVE' ? 'Actif' : status === 'MAINTENANCE' ? 'Maintenance' : 'Inactif',
      value: count,
      color: colors[status] ?? '#94a3b8',
    }))
  }, [initialVehicles])

  const kpis = useMemo(() => {
    const total = filteredDeliveries.length
    const completed = filteredDeliveries.filter((d) => d.status === 'COMPLETED').length
    const delayed = filteredDeliveries.filter((d) => d.status === 'DELAYED').length
    const revenue = filteredDeliveries
      .filter((d) => d.status === 'COMPLETED')
      .reduce((sum, d) => sum + (d.amount ?? 0), 0)
    const activeVehicles = initialVehicles.filter((v) => v.status === 'ACTIVE').length
    return { total, completed, delayed, revenue, activeVehicles, totalVehicles: initialVehicles.length }
  }, [filteredDeliveries, initialVehicles])

  const handleExport = async () => {
    setExporting(true)
    await downloadExport('/api/export/analytics?format=csv', 'rapport_analytics.csv')
    setExporting(false)
  }

  return (
    <div className="space-y-8">
      <div className="md:flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Analytics</h1>
          <p className="text-text-muted mt-1">Tendances livraisons, causes de retards et statut flotte.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="w-[280px]">
            <DateRangePicker
              label=""
              value={range}
              minDate={companyCreatedAt ? new Date(companyCreatedAt) : null}
              maxDate={new Date()}
              onChange={(next) => {
                const sp = new URLSearchParams(searchParams.toString())
                sp.delete('from')
                sp.delete('to')
                const q = dateRangeQuery.toQuery(next)
                Object.entries(q).forEach(([k, v]) => sp.set(k, v))
                const qs = sp.toString()
                router.push(qs ? `/dashboard/analytics?${qs}` : '/dashboard/analytics')
              }}
            />
          </div>
          <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-[#020617] font-bold hover:bg-primaryHover disabled:opacity-70 transition-colors"
            >
              <Download size={18} />
              {exporting ? 'Export...' : 'Exporter'}
            </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Livraisons (période)" value={kpis.total} icon={BarChart3} />
          <KPICard title="Terminées" value={kpis.completed} icon={TrendingUp} />
          <KPICard title="Retardées" value={kpis.delayed} icon={AlertTriangle} />
          <KPICard
            title="Chiffre d'affaires"
            value={kpis.revenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
            trend={`${kpis.totalVehicles} véhicules`}
            icon={Truck}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-main mb-4">Évolution des performances</h2>
            <div className="h-[70vh] max-h-[500px] min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-3)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-text-3)"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => new Date(v).getDate().toString()}
                  />
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-main mb-4">Causes retards (alertes)</h2>
            <div className="h-64">
              {delayCausesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={delayCausesData} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--text-muted)" style={{ fontSize: '10px' }} />
                    <YAxis type="category" dataKey="cause" stroke="var(--text-muted)" style={{ fontSize: '10px' }} width={55} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-main)',
                      }}
                    />
                    <Bar dataKey="count" name="Nombre" fill="#13ec5b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Aucune alerte.</div>
              )}
            </div>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-main mb-4">Statut flotte</h2>
            <div className="flex items-center gap-4 flex-wrap">
              {initialVehicles.length === 0 ? (
                <p className="text-text-muted text-sm">Aucun véhicule.</p>
              ) : (
                <>
                  <div className="h-48 w-full max-w-[200px] mx-auto">
                    {fleetPieData.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={fleetPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {fleetPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--text-main)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Array.from(new Set(initialVehicles.map((v) => v.status))).map((status) => (
                      <StatusIndicator key={status} status={status} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="">
          

          <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-main mb-4">Alertes récentes</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {initialAlerts.length === 0 ? (
                <p className="text-text-muted text-sm">Aucune alerte.</p>
              ) : (
                initialAlerts.slice(0, 10).map((alert) => (
                  <AlertItem key={alert.id} alert={alert} timeAgoLabel={timeAgo(alert.createdAt)} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
