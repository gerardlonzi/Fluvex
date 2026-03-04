'use client'

import React, { useMemo, useState } from 'react'
import {
  BarChart3, Calendar, Download, TrendingUp, Truck, AlertTriangle,
  Bell, RefreshCw, Trash2, Gauge, CloudRain, Zap,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { downloadExport } from '@/utils/downloadExport'

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

function getFilterLabel(filterType: string, selectedDate: string): string {
  if (!selectedDate) return 'Période'
  const d = new Date(selectedDate)
  if (Number.isNaN(d.getTime())) return 'Période'
  if (filterType === 'day') return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  if (filterType === 'week') {
    const end = new Date(d)
    end.setDate(end.getDate() + 6)
    return `Sem. ${d.getDate()}/${d.getMonth() + 1}`
  }
  if (filterType === 'month') return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return 'Période'
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

export default function AnalyticsClient({
  initialDeliveries,
  initialVehicles,
  initialAlerts,
}: {
  initialDeliveries: AnalyticsDelivery[]
  initialVehicles: AnalyticsVehicle[]
  initialAlerts: AnalyticsAlert[]
}) {
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('month')
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [exporting, setExporting] = useState(false)

  const filteredDeliveries = useMemo(() => {
    if (!selectedDate) return initialDeliveries
    const sel = new Date(selectedDate)
    if (Number.isNaN(sel.getTime())) return initialDeliveries
    return initialDeliveries.filter((d) => {
      const created = new Date(d.createdAt)
      if (filterType === 'day') {
        return (
          created.getFullYear() === sel.getFullYear() &&
          created.getMonth() === sel.getMonth() &&
          created.getDate() === sel.getDate()
        )
      }
      if (filterType === 'week') {
        const weekStart = new Date(sel)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        return created >= weekStart && created <= weekEnd
      }
      if (filterType === 'month') {
        return created.getFullYear() === sel.getFullYear() && created.getMonth() === sel.getMonth()
      }
      return true
    })
  }, [initialDeliveries, selectedDate, filterType])

  const chartData = useMemo(() => {
    const buckets = new Map<string, number>()
    const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    filteredDeliveries.forEach((d) => {
      const created = new Date(d.createdAt)
      let key: string
      if (filterType === 'day') {
        key = created.toISOString().slice(0, 10)
      } else if (filterType === 'week') {
        const weekStart = new Date(created)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        key = weekStart.toISOString().slice(0, 10)
      } else {
        key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
      }
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    })
    const entries = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    return entries.map(([key, count]) => {
      if (filterType === 'month') {
        const [y, m] = key.split('-')
        const monthIdx = parseInt(m, 10) - 1
        return { label: monthNames[monthIdx] ?? key, livraisons: count, key }
      }
      if (filterType === 'week' || filterType === 'day') {
        const d = new Date(key)
        return { label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), livraisons: count, key }
      }
      return { label: key, livraisons: count, key }
    })
  }, [filteredDeliveries, filterType])

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
    const revenue = filteredDeliveries.reduce((sum, d) => sum + (d.amount ?? 0), 0)
    const activeVehicles = initialVehicles.filter((v) => v.status === 'ACTIVE').length
    return { total, completed, delayed, revenue, activeVehicles, totalVehicles: initialVehicles.length }
  }, [filteredDeliveries, initialVehicles])

  const handleExport = async () => {
    setExporting(true)
    await downloadExport('/api/export/analytics?format=csv', 'rapport_analytics.csv')
    setExporting(false)
  }

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
      <header className="border-b border-border bg-background/50 backdrop-blur-md md:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main">Analytics</h1>
            <p className="text-text-muted text-sm">Tendances livraisons, causes de retards et statut flotte.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-text-main hover:bg-border transition-colors text-sm font-medium"
              >
                <Calendar size={18} />
                {getFilterLabel(filterType, selectedDate)}
              </button>
              {showCalendar && (
                <div className="absolute top-full right-0 mt-2 bg-surface border border-border rounded-xl p-4 shadow-xl z-50 min-w-[260px]">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {(['day', 'week', 'month'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFilterType(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            filterType === f ? 'bg-primary text-[#020617]' : 'bg-border text-text-muted'
                          }`}
                        >
                          {f === 'day' ? 'Jour' : f === 'week' ? 'Semaine' : 'Mois'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCalendar(false)}
                      className="w-full text-xs text-primary hover:underline"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
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
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto md:p-6 overflow-y-auto space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-main mb-4">Tendance livraisons</h2>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" stroke="var(--text-muted)" style={{ fontSize: '10px' }} />
                    <YAxis stroke="var(--text-muted)" style={{ fontSize: '10px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-main)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="livraisons"
                      name="Livraisons"
                      stroke="#13ec5b"
                      strokeWidth={2}
                      dot={{ fill: '#13ec5b', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">Aucune donnée pour cette période.</div>
              )}
            </div>
          </div>

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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      </main>
    </div>
  )
}
