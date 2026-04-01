'use client'

import React, { useMemo, useState } from 'react'
import {
  Leaf, Shield, Map as MapIcon, Phone, Mail, Edit3, Save,
  TrendingUp, Truck, Award, Calendar, CheckCircle, Navigation,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { DriverFromServer, DeliveryFromServer, RouteRow } from '@/utils/types'
import { DriverCharts } from '@/utils/charts'

function getInitialSelectedId(
  drivers: DriverFromServer[],
  fromUrl: string | undefined
): string {
  if (fromUrl && drivers.some((d) => d.id === fromUrl)) return fromUrl
  return drivers[0]?.id ?? ''
}

export default function DriversClient({
  initialDrivers,
  initialDeliveries,
  initialDriverIdFromUrl,
}: {
  initialDrivers: DriverFromServer[]
  initialDeliveries: DeliveryFromServer[]
  initialDriverIdFromUrl?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState(() =>
    getInitialSelectedId(initialDrivers, initialDriverIdFromUrl)
  )
  const [searchQuery, setSearchQuery] = useState('')

  const drivers = initialDrivers
  const deliveriesForDriver = useMemo(() => {
    if (!selectedDriverId) return []
    return initialDeliveries.filter((d) => d.driverId === selectedDriverId)
  }, [initialDeliveries, selectedDriverId])

  const driver = useMemo(() => {
    const d = drivers.find((x) => x.id === selectedDriverId) ?? drivers[0] ?? null
    if (!d) return null
    const created = typeof d.createdAt === 'string' ? new Date(d.createdAt) : d.createdAt
    const createdYear = created.getFullYear()
    return {
      name: d.name,
      id: d.code,
      role: d.role ?? 'Chauffeur',
      status: d.status,
      phone: d.phone ?? '—',
      email: d.email,
      vehicle: d.vehicle?.name ?? 'Non assigné',
      region: d.region ?? '—',
      since: Number.isFinite(createdYear) ? String(createdYear) : '—',
      avatar: d.avatarUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(d.id)}`,
    }
  }, [drivers, selectedDriverId])

  const routes: RouteRow[] = useMemo(() => {
    return deliveriesForDriver.slice(0, 50).map((d) => {
      const dt = typeof d.createdAt === 'string' ? new Date(d.createdAt) : d.createdAt
      const date = dt.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: '2-digit' })
      const time = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      const score = d.status === 'COMPLETED' ? 96 : d.status === 'DELAYED' ? 72 : 85
      return {
        id: d.id,
        date,
        time,
        route: `Livraison ${d.trackingId}`,
        distance: '—',
        score,
        status: d.status,
      }
    })
  }, [deliveriesForDriver])

  const filteredRoutes = useMemo(() => {
    return routes.filter(
      (r) =>
        r.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.date.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [routes, searchQuery])

  const driverKpis = useMemo(() => {
    const total = deliveriesForDriver.length
    const completed = deliveriesForDriver.filter((d) => d.status === 'COMPLETED').length
    const delayed = deliveriesForDriver.filter((d) => d.status === 'DELAYED').length
    const ecoScore = total ? Math.max(50, Math.round(100 - (delayed / total) * 40)) : 0
    const safety = total ? Math.max(3.5, Math.min(5, 5 - (delayed / total) * 1.2)) : 0
    return { total, completed, delayed, ecoScore, safety }
  }, [deliveriesForDriver])

  return (
    <div className="flex-1 bg-background text-text-main min-h-screen">
      <main className="max-w-[1400px] mx-auto lg:p-2 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-surface rounded-3xl border border-border p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent" />
            <div className="relative mb-6">
              <div className="size-32 mx-auto rounded-full border-4 border-surface shadow-2xl overflow-hidden ring-1 ring-border">
                <img src={driver?.avatar || ''} alt={driver?.name || ''} className="w-full h-full object-cover" />
              </div>
              <span className="absolute bottom-1 right-1/4 bg-primary text-background text-[10px] font-black px-3 py-1 rounded-full border-2 border-surface">
                {driver?.status ?? '—'}
              </span>
            </div>
            {isEditing ? (
              <div className="space-y-3 mb-4">
                <input className="w-full bg-border border border-border rounded-lg p-2 text-center text-sm text-text-main" value={driver?.name ?? ''} onChange={() => {}} disabled />
                <input className="w-full bg-border border border-border rounded-lg p-2 text-center text-xs text-text-muted" value={driver?.role ?? ''} onChange={() => {}} disabled />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight">{driver?.name ?? '—'}</h1>
                <p className="text-text-muted text-sm mb-6">{driver?.role ?? '—'}</p>
              </>
            )}
            <div className="flex justify-center gap-2 mb-8">
              <span className="px-3 py-1 bg-border border border-border rounded-full text-[10px] font-bold text-text-muted uppercase tracking-tight">ID: {driver?.id ?? '—'}</span>
              <span className="px-3 py-1 bg-border border border-border rounded-full text-[10px] font-bold text-text-muted uppercase tracking-tight">Depuis {driver?.since ?? '—'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-border/50 p-3 rounded-2xl border border-border text-center">
                <div className="text-primary flex justify-center mb-1"><Truck size={16} /></div>
                <div className="text-[10px] text-text-muted uppercase font-bold">Véhicule</div>
                <div className="text-xs font-bold">{driver?.vehicle ?? '—'}</div>
              </div>
              <div className="bg-border/50 p-3 rounded-2xl border border-border text-center">
                <div className="text-primary flex justify-center mb-1"><MapIcon size={16} /></div>
                <div className="text-[10px] text-text-muted uppercase font-bold">Région</div>
                <div className="text-xs font-bold">{driver?.region ?? '—'}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
              className="w-full py-3 bg-primary hover:bg-primaryHover text-background font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-primary/10"
            >
              {isEditing ? <><Save size={18} /> Sauvegarder</> : <><Edit3 size={18} /> Modifier Profil</>}
            </button>
            {isEditing && (
              <button type="button" onClick={() => setIsEditing(false)} className="w-full mt-2 text-xs text-text-muted hover:text-text-main transition-colors">Annuler</button>
            )}
          </div>
          <div className="bg-surface rounded-3xl border border-border p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">Informations</h3>
            <div className="flex items-center gap-4">
              <div className="size-8 rounded-xl bg-border flex items-center justify-center text-text-muted border border-border"><Phone size={14} /></div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase">Téléphone</div>
                <div className="text-xs font-medium">{driver?.phone ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-8 rounded-xl bg-border flex items-center justify-center text-text-muted border border-border"><Mail size={14} /></div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase">Email</div>
                <div className="text-xs font-medium">{driver?.email ?? '—'}</div>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded text-[10px] font-black border uppercase bg-primary/10 text-primary border-primary/20">Hazmat</span>
                <span className="px-2 py-1 rounded text-[10px] font-black border uppercase bg-blue-500/10 text-blue-400 border-blue-500/20">Class A CDL</span>
                <span className="px-2 py-1 rounded text-[10px] font-black border uppercase bg-primary/10 text-primary border-primary/20">Eco-Driving</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="bg-surface rounded-3xl border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-text-main">Sélectionner un chauffeur</h2>
              <p className="text-xs text-text-muted">Données chargées côté serveur (livraisons liées au chauffeur).</p>
            </div>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="bg-background border border-border rounded-xl px-4 py-2 text-sm text-text-main"
            >
              {drivers.length === 0 ? (
                <option value="">Pas de chauffeur</option>
              ) : (
                drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} • {d.code}</option>
                ))
              )}
            </select>
            {drivers.length === 0 && <p className="text-xs text-text-muted mt-1">Aucun chauffeur enregistré. Ajoutez-en un dans Gestion de Flotte.</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface p-6 rounded-3xl border border-border shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl text-primary bg-primary/10"><Leaf size={20} /></div>
                <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 flex items-center gap-1"><TrendingUp size={10} /> {driverKpis.total ? `${driverKpis.completed}/${driverKpis.total}` : '—'}</span>
              </div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Score Éco (proxy)</p>
              <h3 className="text-3xl font-black text-text-main mt-1">{String(driverKpis.ecoScore || 0)}<span className="text-sm font-normal text-text-muted">/100</span></h3>
            </div>
            <div className="bg-surface p-6 rounded-3xl border border-border shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl text-blue-400 bg-blue-400/10"><Shield size={20} /></div>
                <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 flex items-center gap-1"><TrendingUp size={10} /> {driverKpis.delayed ? `${driverKpis.delayed} retard(s)` : '—'}</span>
              </div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Note Sécurité (proxy)</p>
              <h3 className="text-3xl font-black text-text-main mt-1">{driverKpis.safety ? driverKpis.safety.toFixed(1) : '—'}<span className="text-sm font-normal text-text-muted">/5.0</span></h3>
            </div>
            <div className="bg-surface p-6 rounded-3xl border border-border shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl text-orange-400 bg-orange-400/10"><Navigation size={20} /></div>
                <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 flex items-center gap-1"><TrendingUp size={10} /> {driverKpis.total} livraisons</span>
              </div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Livraisons (60j)</p>
              <h3 className="text-3xl font-black text-text-main mt-1">{String(driverKpis.total)}</h3>
            </div>
          </div>

          <div className="bg-surface rounded-3xl border border-border p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
              <div>
                <h3 className="text-xl font-bold text-text-main">Activité (6 derniers mois)</h3>
                <p className="text-sm text-text-muted">Livraisons et score moyen par mois pour ce chauffeur</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-primary">{driverKpis.total} <span className="text-sm font-normal text-text-muted">livraisons</span></span>
                <p className="text-[10px] font-bold text-primary uppercase">60 derniers jours</p>
              </div>
            </div>
            <DriverCharts deliveriesForDriver={deliveriesForDriver} />
          </div>

          <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-border/20">
              <h3 className="text-lg font-bold">Historique des trajets</h3>
              <button type="button" className="text-xs font-bold text-primary hover:underline">Voir tout</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-border/50 text-[10px] font-black uppercase text-text-muted tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Itinéraire</th>
                    <th className="px-8 py-4">Distance</th>
                    <th className="px-8 py-4 text-center">Score</th>
                    <th className="px-8 py-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-border/20 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-text-main">{route.date}</div>
                        <div className="text-[10px] text-text-muted">{route.time}</div>
                      </td>
                      <td className="px-8 py-5 font-medium text-text-muted">{route.route}</td>
                      <td className="px-8 py-5 text-text-muted font-mono text-xs">{route.distance}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${route.score > 90 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent border-accent/20'}`}>{route.score}/100</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {route.status === 'COMPLETED' ? (
                          <div className="flex items-center justify-end gap-2 text-primary font-bold text-xs"><CheckCircle size={14} /> Terminée</div>
                        ) : (
                          <div className="flex items-center justify-end gap-2 text-text-muted font-bold text-xs"><Calendar size={14} /> {route.status}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRoutes.length === 0 && <div className="p-10 text-center text-text-muted italic">Aucun trajet correspondant</div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
