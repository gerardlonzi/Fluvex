'use client'

import { ArrowUpRight, ArrowDownRight, Activity, Battery, Zap, PackageCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { DateRangePicker, dateRangeQuery } from '@/src/components/ui/date-range-picker'
import type { RecentDelivery, DashboardStats } from '@/utils/types'
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

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  LOADING: 'Chargement',
  TRANSIT: 'En cours',
  DELAYED: 'Retardé',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
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
}: {
  initialRecentDeliveries: RecentDelivery[]
  initialStats: DashboardStats
  initialFrom: string | null
  initialTo: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>(initialRecentDeliveries || [])
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [isLoadingRecent, setIsLoadingRecent] = useState(false)
  const [range, setRange] = useState(dateRangeQuery.parse(searchParams))

  // NOUVEAU useEffect aligné sur celui de DeliveriesClient
  useEffect(() => {
    const currentFrom = searchParams.get('from')
    const currentTo = searchParams.get('to')

    // On fetch SEULEMENT si filtre actif ET différent de l'initial
    if (
      (currentFrom || currentTo) &&
      (currentFrom !== initialFrom || currentTo !== initialTo)
    ) {
      const fetchFiltered = async () => {
        setIsLoadingRecent(true)
        try {
          const params = new URLSearchParams()
          if (currentFrom) params.set('from', currentFrom)
          if (currentTo) params.set('to', currentTo)

          const response = await fetch(`/api/deliveries?${params.toString()}`)
          if (!response.ok) throw new Error('Erreur lors du filtrage')

          const { deliveries } = await response.json()

          // Mise à jour liste récente (limite à 10)
          setRecentDeliveries(deliveries.slice(0, 10))

          // Stats dynamiques
          const active = deliveries.filter(d => 
            ['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'].includes(d.status)
          ).length

          const completed = deliveries.filter(d => d.status === 'COMPLETED').length
          const co2Saved = Math.round(completed * 0.5)
          const totalRevenue = deliveries.reduce((sum, d) => sum + (d.amount || 0), 0)

          setStats({
            ...initialStats,
            activeDeliveries: active,
            completedThisMonth: completed,
            co2SavedKg: co2Saved,
            totalRevenue,
            from: currentFrom,
            to: currentTo,
          })
        } catch (error) {
          console.error('Erreur fetch filtré dashboard :', error)
          // Reset en cas d'erreur
          setRecentDeliveries(initialRecentDeliveries || [])
          setStats(initialStats)
        } finally {
          setIsLoadingRecent(false)
        }
      }

      fetchFiltered()
    } else {
      // Reset aux données initiales
      setRecentDeliveries(initialRecentDeliveries || [])
      setStats(initialStats)
      setIsLoadingRecent(false)
    }
  }, [searchParams, initialFrom, initialTo, initialRecentDeliveries, initialStats])

  // Graph linéaire (Simple Line Chart style)
  const chartData = useMemo(() => {
    console.log('[GRAPHE] Calcul démarré - Nombre de livraisons reçues :', recentDeliveries.length)
    console.log('[GRAPHE] Exemple première livraison :', recentDeliveries[0] || 'Aucune')
  
    const map = new Map<string, { livraisons: number; terminees: number; revenu: number; co2: number }>()
  
    recentDeliveries.forEach((d, index) => {
      if (!d?.createdAt || typeof d.createdAt !== 'string') {
        console.warn(`[GRAPHE] Livraison ignorée #${index} - pas de createdAt valide`)
        return
      }
  
      const dateObj = new Date(d.createdAt)
      if (isNaN(dateObj.getTime())) {
        console.warn(`[GRAPHE] Date invalide ignorée pour livraison #${index} : ${d.createdAt}`)
        return
      }
  
      const day = dateObj.toISOString().split('T')[0] // YYYY-MM-DD
  
      const prev = map.get(day) || { livraisons: 0, terminees: 0, revenu: 0, co2: 0 }
      prev.livraisons += 1
  
      if (d.status === 'COMPLETED') {
        prev.terminees += 1
        prev.revenu += Number(d.amount) || 0
        prev.co2 += 0.5
      }
  
      map.set(day, prev)
    })
  
    const data = Array.from(map.entries())
      .map(([date, v]) => ({
        date,
        Livraisons: v.livraisons,
        Terminées: v.terminees,
        Revenu: Math.round(v.revenu),
        'CO₂ économisé': Math.round(v.co2 * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  
    console.log('[GRAPHE] Données finales générées :', data)
    console.log('[GRAPHE] Nombre de points sur le graphe :', data.length)
  
    return data
  }, [recentDeliveries])

  console.log("voici le resultat de ton chartData " + chartData)
  return (
    <div className="space-y-8 my-16 md:my-0">
      <div className="md:flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Tableau de bord</h1>
          <p className="text-text-muted mt-1">Bienvenue, voici l'état de votre flotte en temps réel.</p>
        </div>
        <div className="flex space-x-4 items-center justify-between md:justify-normal mt-10 md:mt-0">
          <div className="w-[280px]">
            <DateRangePicker
              label="Filtrer par période"
              value={range}
              onChange={(next) => {
                setRange(next)
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

      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-text-main mb-6">Évolution des performances</h2>
        <div className="h-80">
  {chartData.length === 0 ? (
    <div className="h-full flex flex-col items-center justify-center text-text-muted text-center">
      <p>Aucune donnée pour le graphe</p>
      <p className="text-xs mt-2">Vérifie la période sélectionnée ou ajoute des livraisons</p>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
        <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '6px', color: '#F3F4F6' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line type="monotone" dataKey="Livraisons" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="Terminées" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="Revenu" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="CO₂ économisé" stroke="#EC4899" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )}
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
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20">
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