'use client'

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, ArrowUpDown, Download, ChevronRight, ChevronLeft, Truck, CheckCircle,
  Clock, AlertTriangle, MapPin, Calendar, Phone, User, X, Package, ShieldCheck,
  Plus, Trash2, Pencil, Save, XCircle,
} from 'lucide-react'
import { downloadExport } from '@/utils/downloadExport'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { useToast } from '@/src/components/ui/toast'
import { updateDeliveryFormSchema, type UpdateDeliveryFormInput } from '@/lib/validations/delivery'
import type { DeliveryRow, DriverOption, VehicleOption } from '@/utils/types'
import { deleteDelivery, updateDelivery, cancelDelivery } from './actions'
import { DateRangePicker, dateRangeQuery } from '@/src/components/ui/date-range-picker'


const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', LOADING: 'Chargement', TRANSIT: 'En transit', DELAYED: 'Retardé',
  COMPLETED: 'Terminée', CANCELLED: 'Annulée',
}
const EXPIRED_LABEL = 'Livraison expirée'
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

function isDeliveryExpired(row: { status: string; scheduledAt?: string | null }): boolean {
  if (row.status === 'COMPLETED' || row.status === 'CANCELLED') return false
  if (!row.scheduledAt) return false
  const scheduled = new Date(row.scheduledAt)
  return !Number.isNaN(scheduled.getTime()) && new Date() > scheduled
}

function isDeliveryDueToday(row: { status: string; scheduledAt?: string | null }): boolean {
  if (row.status === 'COMPLETED' || row.status === 'CANCELLED') return false
  if (!row.scheduledAt) return false
  const scheduled = new Date(row.scheduledAt)
  const today = new Date()
  return !Number.isNaN(scheduled.getTime()) &&
    scheduled.getDate() === today.getDate() &&
    scheduled.getMonth() === today.getMonth() &&
    scheduled.getFullYear() === today.getFullYear()
}

function getStatusColor(statusLabel: string): string {
  switch (statusLabel) {
    case EXPIRED_LABEL: return 'bg-amber-500/20 text-amber-500 border-amber-500/40'
    case 'En transit': return 'bg-primary/10 text-primary border-primary/20'
    case 'Chargement': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'En attente': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'Retardé': return 'bg-danger/10 text-danger border-danger/20'
    case 'Terminée': return 'bg-primary/10 text-primary border-primary/20'
    case 'Annulée': return 'bg-gray-500/10 text-gray-500'
    default: return 'bg-gray-500/10 text-gray-500'
  }
}

function mapApiToRow(d: {
  id: string; trackingId: string; status: string; amount: unknown; currency: string
  driver: { name: string } | null; driverId?: string | null; vehicleId?: string | null
  deliveryAddress?: string | null; recipientCompany?: string | null; contactName?: string | null; contactPhone?: string | null
  packageName?: string | null; weightKg?: number | null; dimensionsL?: number | null; dimensionsW?: number | null; dimensionsH?: number | null; packageType?: string | null
  scheduledAt?: unknown; createdAt?: unknown; startedAt?: unknown; completedAt?: unknown
}): DeliveryRow {
  const toIso = (v: unknown): string | undefined => {
    if (!v) return undefined
    if (typeof v === 'string') return v
    if (v instanceof Date) return v.toISOString()
    return undefined
  }
  return {
    id: d.id,
    trackingId: d.trackingId,
    client: d.recipientCompany ?? '—',
    status: d.status,
    statusLabel: STATUS_LABELS[d.status] ?? d.status,
    driver: d.driver?.name ?? 'Non assigné',
    driverId: d.driverId ?? null,
    vehicleId: d.vehicleId ?? null,
    dest: d.deliveryAddress ?? '—',
    amount: d.amount != null ? String(d.amount) : '—',
    currency: d.currency ?? 'CFA',
    contactName: d.contactName ?? undefined,
    contactPhone: d.contactPhone ?? undefined,
    packageName: d.packageName ?? undefined,
    weightKg: d.weightKg ?? undefined,
    dimensionsL: d.dimensionsL ?? undefined,
    dimensionsW: d.dimensionsW ?? undefined,
    dimensionsH: d.dimensionsH ?? undefined,
    packageType: d.packageType ?? undefined,
    scheduledAt: toIso(d.scheduledAt),
    createdAt: toIso(d.createdAt),
    startedAt: toIso(d.startedAt),
    completedAt: toIso(d.completedAt),
  }
}

export default function DeliveriesClient({
  initialDeliveries,
  initialDrivers,
  initialVehicles,
  initialFrom,
  initialTo,
  companyCreatedAt,
}: {
  initialDeliveries: DeliveryRow[]
  initialDrivers: DriverOption[]
  initialVehicles: VehicleOption[]
  initialFrom: string | null
  initialTo: string | null
  companyCreatedAt: string
}) {
  const { showError, showSuccess } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const range = useMemo(() => dateRangeQuery.parse(searchParams), [searchParams])
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>(initialDeliveries)
  const [tab, setTab] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'expired'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [editDelivery, setEditDelivery] = useState<DeliveryRow | null>(null)
  const [showClientDetails, setShowClientDetails] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const [isFiltering, setIsFiltering] = useState(false)


  useEffect(() => {
    const currentFrom = searchParams.get('from')
    const currentTo = searchParams.get('to')
  
    // On fetch seulement si les params ont changé par rapport à l'initial
    if (
      (currentFrom || currentTo) && // il y a un filtre actif
      (currentFrom !== initialFrom || currentTo !== initialTo) // différent de l'initial
    ) {
      const fetchFilteredDeliveries = async () => {
        setIsFiltering(true)
        try {
          const params = new URLSearchParams()
          if (currentFrom) params.set('from', currentFrom)
          if (currentTo) params.set('to', currentTo)
  
          const response = await fetch(`/api/deliveries?${params.toString()}`)
          if (!response.ok) throw new Error('Erreur lors du filtrage')
  
          const data = await response.json()
          const deliveries = Array.isArray(data) ? data : (data?.deliveries ?? [])
          setDeliveries(deliveries.map(mapApiToRow))
        } catch (error) {
          console.error('Erreur fetch filtré:', error)
          // Optionnel : toast d'erreur
          // showError('Impossible de filtrer les livraisons')
        } finally {
          setIsFiltering(false)
        }
      }
  
      fetchFilteredDeliveries()
    } else {
      // Si on revient aux params initiaux → on remet les données serveur
      setDeliveries(initialDeliveries)
    }
  }, [searchParams, initialDeliveries, initialFrom, initialTo])






  const filteredByTab = useMemo(() => {
    if (tab === 'all') return deliveries
    if (tab === 'active') return deliveries.filter((d) => ['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'].includes(d.status) && !isDeliveryExpired({ status: d.status, scheduledAt: d.scheduledAt }))
    if (tab === 'completed') return deliveries.filter((d) => d.status === 'COMPLETED')
    if (tab === 'expired') return deliveries.filter((d) => ['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'].includes(d.status) && isDeliveryExpired({ status: d.status, scheduledAt: d.scheduledAt }))
    return deliveries.filter((d) => d.status === 'CANCELLED')
  }, [deliveries, tab])

  const filtered = useMemo(() => {
    let result = filteredByTab
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((d) =>
        d.trackingId.toLowerCase().includes(q) ||
        d.client.toLowerCase().includes(q) ||
        d.driver.toLowerCase().includes(q)
      )
    }
    return result
  }, [filteredByTab, searchQuery])

  const countActive = deliveries.filter((d) => ['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'].includes(d.status) && !isDeliveryExpired({ status: d.status, scheduledAt: d.scheduledAt })).length
  const countCompleted = deliveries.filter((d) => d.status === 'COMPLETED').length
  const countCancelled = deliveries.filter((d) => d.status === 'CANCELLED').length
  const countAll = deliveries.length
  const countExpired = deliveries.filter((d) => ['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'].includes(d.status) && isDeliveryExpired({ status: d.status, scheduledAt: d.scheduledAt })).length

  const handleExport = async () => {
    setExporting(true)
    await downloadExport('/api/export/deliveries?format=csv', 'livraisons.csv')
    setExporting(false)
  }

  const handleRequestDelete = (id: string) => setDeleteConfirmId(id)

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return
    setDeletingId(deleteConfirmId)
    const previous = deliveries
    setDeliveries((prev) => prev.filter((d) => d.id !== deleteConfirmId))
    setSelectedDelivery(null)
    const idToDelete = deleteConfirmId
    setDeleteConfirmId(null)
    try {
      await deleteDelivery(idToDelete)
      showSuccess('Livraison supprimée.')
    } catch {
      setDeliveries(previous)
      showError('Erreur lors de la suppression.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCancelDelivery = async () => {
    if (!cancelConfirmId) return
    setCancellingId(cancelConfirmId)
    const previous = deliveries
    setDeliveries((prev) =>
      prev.map((d) => (d.id === cancelConfirmId ? { ...d, status: 'CANCELLED', statusLabel: 'Annulée' } : d))
    )
    setSelectedDelivery((prev) => (prev?.id === cancelConfirmId ? { ...prev!, status: 'CANCELLED', statusLabel: 'Annulée' } : prev))
    const idToCancel = cancelConfirmId
    setCancelConfirmId(null)
    try {
      const updated = await cancelDelivery(idToCancel)
      const row = mapApiToRow(updated)
      setDeliveries((prev) => prev.map((d) => (d.id === idToCancel ? row : d)))
      setSelectedDelivery((prev) => (prev?.id === idToCancel ? row : prev))
      showSuccess('Livraison annulée.')
    } catch {
      setDeliveries(previous)
      showError('Erreur lors de l\'annulation.')
    } finally {
      setCancellingId(null)
    }
  }

  const handleSaveEdit = async (payload: UpdateDeliveryFormInput) => {
    if (!editDelivery) return
    setSavingEdit(true)
    const previous = deliveries
    const optimistic: DeliveryRow = {
      ...editDelivery,
      status: payload.status ?? editDelivery.status,
      statusLabel: STATUS_LABELS[payload.status ?? ''] ?? editDelivery.statusLabel,
      driverId: payload.driverId ?? null,
      vehicleId: payload.vehicleId ?? null,
      client: payload.recipientCompany ?? editDelivery.client,
      dest: payload.deliveryAddress ?? editDelivery.dest,
      contactName: payload.contactName ?? undefined,
      contactPhone: payload.contactPhone ?? undefined,
      amount: payload.amount ?? editDelivery.amount,
      currency: payload.currency ?? editDelivery.currency,
      driver: payload.driverId ? (initialDrivers.find((d) => d.id === payload.driverId)?.name ?? editDelivery.driver) : 'Non assigné',
    }
    setDeliveries((prev) => prev.map((d) => (d.id === editDelivery.id ? optimistic : d)))
    setSelectedDelivery((prev) => (prev?.id === editDelivery.id ? optimistic : prev))
    setEditDelivery(null)
    try {
      const updated = await updateDelivery(editDelivery.id, {
        status: payload.status,
        driverId: payload.driverId || null,
        vehicleId: payload.vehicleId || null,
        recipientCompany: payload.recipientCompany || null,
        deliveryAddress: payload.deliveryAddress || null,
        contactName: payload.contactName || null,
        contactPhone: payload.contactPhone || null,
        amount: payload.amount ? parseFloat(payload.amount) : null,
        currency: payload.currency ?? 'CFA',
      })
      const row = mapApiToRow(updated)
      setDeliveries((prev) => prev.map((d) => (d.id === editDelivery.id ? row : d)))
      setSelectedDelivery((prev) => (prev?.id === editDelivery.id ? row : prev))
      showSuccess('Livraison mise à jour.')
    } catch {
      setDeliveries(previous)
      setEditDelivery(editDelivery)
      showError('Erreur lors de la mise à jour.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col relative overflow-hidden">
      <header className="border-b border-border bg-background/50 backdrop-blur-md md:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-main">Centre de Gestion des Livraisons</h1>
              <p className="text-text-muted text-sm">Gérez, suivez et optimisez vos opérations en temps réel.</p>
            </div>
            <Link href="/dashboard/deliveries/new" className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-[#020617] font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(19,236,91,0.2)]">
              <Plus className="text-xl leading-none" />
              <span>Nouvelle Livraison</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto md:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Livraisons Actives" value={String(countActive)} trend="—" icon={<Truck className="text-primary" />} />
          <StatCard title="Terminées" value={String(countCompleted)} trend="—" icon={<CheckCircle className="text-accent" />} />
          <StatCard title="En Attente" value={String(deliveries.filter((d) => d.status === 'PENDING' && !isDeliveryExpired({ status: d.status, scheduledAt: d.scheduledAt })).length)} trend="—" icon={<Clock className="text-yellow-500" />} />
          <StatCard title="Annulées" value={String(countCancelled)} trend="—" icon={<AlertTriangle className="text-danger" />} />
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm  flex flex-col">
          <div className="border-b border-border px-6 overflow-x-auto flex items-center justify-between bg-surface/50">
            <div className="flex gap-6 pt-5 w-[400px] md:w-auto">
              <TabButton active={tab === 'all'} onClick={() => setTab('all')} label="Tous" count={String(countAll)} />
              <TabButton active={tab === 'active'} onClick={() => setTab('active')} label="Actives" count={String(countActive)} />
              <TabButton active={tab === 'completed'} onClick={() => setTab('completed')} label="Terminées" count={String(countCompleted)} />
              <TabButton active={tab === 'cancelled'} onClick={() => setTab('cancelled')} label="Annulées" count={String(countCancelled)} />
              <TabButton active={tab === 'expired'} onClick={() => setTab('expired')} label="Expirées" count={String(countExpired)} />
            </div>
          </div>

          <div className="p-4 border-b border-border flex flex-col lg:flex-row gap-4 justify-between bg-surface">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="Rechercher par ID, Client ou Chauffeur..."
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="w-[320px] hidden lg:block">
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
                    router.push(qs ? '/dashboard/deliveries?' + qs : '/dashboard/deliveries')
                                 
                     }}
                />
              </div>
              <button type="button" onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-transparent bg-primary text-[#020617] hover:bg-primaryHover disabled:opacity-70 transition-colors">
                <Download size={16} /><span className="hidden lg:inline">{exporting ? 'Export...' : 'Exporter'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto mb-20 md:mb-0">
            <table className="w-full text-left text-sm w-[1000px] md:w-full">
              <thead className="bg-background/50 border-b border-border uppercase text-xs font-semibold text-text-muted">
                <tr>
                  <th className="px-6 py-4">ID Suivi</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Chauffeur</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">ETA / Arrivée</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">

              {isFiltering ? <p>chargement </p> :
               (filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedDelivery(item)}
                    className={`group hover:bg-border/30 cursor-pointer transition-colors ${selectedDelivery?.id === item.id ? 'bg-border/40' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono font-medium text-text-main">{item.trackingId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs font-bold text-text-main">{item.client.slice(0, 2).toUpperCase()}</div>
                        <span className="font-medium text-text-main">{item.client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(isDeliveryExpired(item) ? EXPIRED_LABEL : item.statusLabel)}`}>
                        {isDeliveryExpired(item) && <span title="Livraison expirée"><AlertTriangle size={12} className="shrink-0" /></span>}
                        {isDeliveryDueToday(item) && !isDeliveryExpired(item) && <span title="Livraison prévue aujourd'hui"><Calendar size={12} className="shrink-0 text-primary" /></span>}
                        {isDeliveryExpired(item) ? EXPIRED_LABEL : item.statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center"><User size={12} /></div>
                        {item.driver}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted max-w-[200px] truncate">{item.dest}</td>
                    <td className="px-6 py-4">
                      <div className="text-text-main font-medium">{item.amount !== '—' ? `${item.amount} ${item.currency}` : '—'}</div>
                      <div className="text-xs text-text-muted">{item.statusLabel}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" className="p-2 hover:bg-border rounded-full text-text-muted hover:text-primary transition-colors"><ChevronRight size={18} /></button>
                    </td>
                  </tr>
                )))
              }
              </tbody>
            </table>
          </div>

          <div className="bg-background/50 px-6 py-3 border-t border-border flex items-center justify-between">
            <p className="text-sm text-text-muted">Affichage de <span className="text-text-main font-bold">{filtered.length}</span> résultat(s)</p>
            <div className="flex gap-1">
              <button type="button" className="p-1 rounded hover:bg-border text-text-muted"><ChevronLeft size={20} /></button>
              <button type="button" className="p-1 px-3 rounded bg-primary/20 text-primary font-bold text-sm border border-primary/30">1</button>
              <button type="button" className="p-1 px-3 rounded hover:bg-border text-text-muted text-sm">2</button>
              <button type="button" className="p-1 rounded hover:bg-border text-text-muted"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      </main>

      {selectedDelivery && (
        <>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-30 transition-opacity duration-300" onClick={() => setSelectedDelivery(null)} aria-hidden />
          <aside className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-surface shadow-2xl z-40 border-l border-border transform transition-transform duration-300 animate-in slide-in-from-right flex flex-col">
            <div className="flex flex-col gap-4 p-6 border-b border-border bg-surface">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-text-main">{selectedDelivery.trackingId}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(isDeliveryExpired(selectedDelivery) ? EXPIRED_LABEL : selectedDelivery.statusLabel)}`}>
                      {isDeliveryExpired(selectedDelivery) && <span title="Livraison expirée"><AlertTriangle size={12} /></span>}
                      {isDeliveryDueToday(selectedDelivery) && !isDeliveryExpired(selectedDelivery) && <span title="Livraison prévue aujourd'hui"><Calendar size={12} className="text-primary" /></span>}
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {isDeliveryExpired(selectedDelivery) ? EXPIRED_LABEL : selectedDelivery.statusLabel}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm">Standard Logistics • Zone 4B</p>
                </div>
                <div className="flex gap-2">
                  {['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'].includes(selectedDelivery.status) && (
                    <button type="button" onClick={() => setCancelConfirmId(selectedDelivery.id)} disabled={cancellingId === selectedDelivery.id} className="p-2 hover:bg-amber-500/10 rounded-lg text-text-muted hover:text-amber-500 transition-colors" title="Annuler la livraison"><XCircle size={20} /></button>
                  )}
                  <button type="button" onClick={() => setEditDelivery(selectedDelivery)} className="p-2 hover:bg-primary/10 rounded-lg text-text-muted hover:text-primary transition-colors" title="Modifier la livraison"><Pencil size={20} /></button>
                  <button type="button" onClick={() => handleRequestDelete(selectedDelivery.id)} disabled={deletingId === selectedDelivery?.id} className="p-2 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition-colors" title="Supprimer la livraison"><Trash2 size={20} /></button>
                  <button type="button" onClick={() => setSelectedDelivery(null)} className="p-2 hover:bg-border rounded-lg text-text-main transition-colors"><X size={20} /></button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Information du colis - toujours affiché */}
              <div className="border border-border rounded-xl p-4 bg-background">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Information du colis</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-text-main"><span className="font-medium text-text-muted">Nom du colis:</span> {selectedDelivery.packageName ?? '—'}</p>
                  <p className="text-text-main"><span className="font-medium text-text-muted">Poids:</span> {selectedDelivery.weightKg != null ? `${selectedDelivery.weightKg} kg` : '—'}</p>
                  <p className="text-text-main">
                    <span className="font-medium text-text-muted">Taille (L×l×H):</span>{' '}
                    {(selectedDelivery.dimensionsL != null || selectedDelivery.dimensionsW != null || selectedDelivery.dimensionsH != null)
                      ? [selectedDelivery.dimensionsL, selectedDelivery.dimensionsW, selectedDelivery.dimensionsH].filter(Boolean).join(' × ') + ' cm'
                      : '—'}
                  </p>
                  <p className="text-text-main">
                    <span className="font-medium text-text-muted">Type:</span>{' '}
                    {selectedDelivery.packageType === 'STANDARD' ? 'Boîte Standard' : selectedDelivery.packageType === 'FRAGILE' ? 'Fragile / Verre' : selectedDelivery.packageType === 'REFRIGERATED' ? 'Réfrigéré' : selectedDelivery.packageType ?? '—'}
                  </p>
                  <p className="text-text-main"><span className="font-medium text-text-muted">Montant:</span> {selectedDelivery.amount} {selectedDelivery.currency}</p>
                  <p className="text-text-muted text-xs"><span className="font-medium text-text-muted">Destination:</span> {selectedDelivery.dest}</p>
                </div>
              </div>

              {/* Détails - chronologie, chauffeur, client */}
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Détails</h3>
                <div className="space-y-6">
                  <div className="rounded-xl overflow-hidden border border-border h-40 bg-background relative group">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/2.3522,48.8566,12/400x200?access_token=YOUR_TOKEN')] bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-500" aria-hidden />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <button type="button" className="bg-primary hover:bg-primaryHover text-[#020617] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg"><MapPin size={14} /> Suivre en direct</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Chronologie</p>
                    <DeliveryTimeline delivery={selectedDelivery} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background border border-border p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2 text-text-muted text-xs uppercase font-bold"><User size={14} /> Chauffeur</div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border" />
                        <div>
                          <div className="text-sm font-bold text-text-main">{selectedDelivery.driver}</div>
                          <div className="text-xs text-text-muted">4.9 ★</div>
                        </div>
                        <button type="button" className="ml-auto bg-border p-1.5 rounded-lg text-primary hover:bg-primary hover:text-black transition-colors"><Phone size={14} /></button>
                      </div>
                    </div>
                    <div className="bg-background border border-border p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2 text-text-muted text-xs uppercase font-bold"><Package size={14} /> Cargaison</div>
                      <p className="text-text-main font-bold text-lg">{selectedDelivery.amount} <span className="text-sm font-normal text-text-muted">{selectedDelivery.currency}</span></p>
                      <p className="text-text-muted text-xs">Destination: {selectedDelivery.dest}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Client / Destinataire</h3>
                  {(selectedDelivery.client !== '—' || selectedDelivery.contactName || selectedDelivery.contactPhone) && (
                    <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20"><ShieldCheck size={12} /> Compte Vérifié</span>
                  )}
                </div>
                <div className="bg-background border border-border p-4 rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-text-main font-bold">{selectedDelivery.client}</div>
                      <div className="text-text-muted text-xs mt-1">{selectedDelivery.dest}</div>
                      {showClientDetails && (
                        <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
                          {selectedDelivery.contactName && <p className="text-text-muted"><span className="font-medium text-text-main">Contact:</span> {selectedDelivery.contactName}</p>}
                          {selectedDelivery.contactPhone && <p className="text-text-muted flex items-center gap-1"><Phone size={12} /> {selectedDelivery.contactPhone}</p>}
                          {!selectedDelivery.contactName && !selectedDelivery.contactPhone && <p className="text-text-muted italic">Aucun détail de contact enregistré.</p>}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => setShowClientDetails(!showClientDetails)} className="text-xs border border-border bg-surface text-text-main px-3 py-1.5 rounded-lg hover:bg-border transition-colors shrink-0">{showClientDetails ? 'Masquer' : 'Détails'}</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border bg-background flex gap-3">
              <button type="button" className="flex-1 bg-surface border border-border text-text-main font-bold py-3 rounded-xl hover:bg-border transition-colors">Signaler un problème</button>
              <button type="button" className="flex-1 bg-primary text-[#020617] font-bold py-3 rounded-xl hover:bg-primaryHover transition-colors shadow-[0_0_15px_rgba(19,236,91,0.2)]">Voir Preuve de Livraison</button>
            </div>
          </aside>
        </>
      )}

      <ConfirmDialog open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} onConfirm={handleConfirmDelete} title="Supprimer la livraison" description="Êtes-vous sûr de vouloir supprimer cette livraison ? Cette action est irréversible." confirmLabel="Supprimer" cancelLabel="Annuler" variant="danger" loading={deletingId !== null} />
      <ConfirmDialog open={cancelConfirmId !== null} onClose={() => setCancelConfirmId(null)} onConfirm={handleCancelDelivery} title="Annuler la livraison" description="Êtes-vous sûr de vouloir annuler cette livraison ? Elle passera au statut « Annulée »." confirmLabel="Annuler la livraison" cancelLabel="Retour" variant="warning" loading={cancellingId !== null} />

      {editDelivery && (
        <EditDeliveryModal delivery={editDelivery} drivers={initialDrivers} vehicles={initialVehicles} onClose={() => setEditDelivery(null)} onSave={handleSaveEdit} saving={savingEdit} statusLabels={STATUS_LABELS} />
      )}
    </div>
  )
}

function StatCard({ title, value, trend, icon }: { title: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl p-5 border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm font-medium">{title}</p>
        <div className="bg-background p-2 rounded-lg border border-border">{icon}</div>
      </div>
      <div className="flex items-end gap-2 mt-2">
        <p className="text-3xl font-extrabold text-text-main">{value}</p>
        <span className="text-sm font-bold mb-1 flex items-center text-primary"><ArrowUpDown size={12} className="mr-1" /> {trend}</span>
      </div>
    </div>
  )
}

function TabButton({ label, count, active, onClick }: { label: string; count: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`pb-4 px-1 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${active ? 'border-primary text-text-main' : 'border-transparent text-text-muted hover:text-text-main'}`}>
      {label}
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-primary/20 text-primary' : 'bg-border text-text-muted'}`}>{count}</span>
    </button>
  )
}

function formatTimelineDate(isoStr: string | null | undefined): string {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function DeliveryTimeline({ delivery }: { delivery: DeliveryRow }) {
  const steps: { label: string; date: string | null | undefined; active: boolean }[] = []
  if (delivery.completedAt) {
    steps.push({ label: 'Livraison terminée', date: delivery.completedAt, active: true })
    steps.push({ label: 'En transit', date: delivery.startedAt, active: false })
  } else if (delivery.startedAt) {
    steps.push({ label: 'En cours de livraison', date: delivery.startedAt, active: true })
    steps.push({ label: 'Commande confirmée', date: delivery.createdAt, active: false })
  } else {
    steps.push({ label: 'Commande en attente', date: delivery.scheduledAt || delivery.createdAt, active: true })
    steps.push({ label: 'Commande créée', date: delivery.createdAt, active: false })
  }
  if (delivery.scheduledAt && !steps.some((s) => s.date === delivery.scheduledAt)) steps.push({ label: 'Livraison prévue', date: delivery.scheduledAt, active: false })
  steps.sort((a, b) => { const da = a.date ? new Date(a.date).getTime() : 0; const db = b.date ? new Date(b.date).getTime() : 0; return db - da })
  return (
    <div className="space-y-6 relative pl-2">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
      {steps.map((step, i) => (
        <div key={i} className="relative flex gap-4">
          <div className={`w-4 h-4 rounded-full ring-4 ring-surface z-10 mt-1 shrink-0 ${step.active ? 'bg-primary' : 'bg-border'}`} />
          <div>
            <p className={`font-medium text-sm ${step.active ? 'text-text-main' : 'text-text-muted'}`}>{step.label}</p>
            <p className="text-text-muted text-xs">{formatTimelineDate(step.date)}</p>
          </div>
        </div>
      ))}
      {steps.length === 0 && <p className="text-text-muted text-sm">Aucune donnée de chronologie disponible.</p>}
    </div>
  )
}





function EditDeliveryModal({
  delivery,
  drivers,
  vehicles,
  onClose,
  onSave,
  saving,
  statusLabels,
}: {
  delivery: DeliveryRow
  drivers: DriverOption[]
  vehicles: VehicleOption[]
  onClose: () => void
  onSave: (payload: UpdateDeliveryFormInput) => Promise<void>
  saving: boolean
  statusLabels: Record<string, string>
}) {
  const [addressSuggestions, setAddressSuggestions] = useState<{ id: string; place_name: string }[]>([])
  const [addressSearching, setAddressSearching] = useState(false)
  const addressSuggestionsRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, setValue, watch } = useForm<UpdateDeliveryFormInput>({
    resolver: zodResolver(updateDeliveryFormSchema),
    defaultValues: {
      status: delivery.status,
      driverId: delivery.driverId ?? '',
      vehicleId: delivery.vehicleId ?? '',
      recipientCompany: delivery.client === '—' ? '' : delivery.client,
      deliveryAddress: delivery.dest === '—' ? '' : delivery.dest,
      contactName: delivery.contactName ?? '',
      contactPhone: delivery.contactPhone ?? '',
      amount: delivery.amount === '—' ? '' : delivery.amount,
      currency: delivery.currency ?? 'CFA',
    },
  })
  const deliveryAddress = watch('deliveryAddress')

  useEffect(() => {
    if (!deliveryAddress?.trim() || deliveryAddress.length < 3 || !MAPBOX_TOKEN) { setAddressSuggestions([]); return }
    const t = setTimeout(async () => {
      setAddressSearching(true)
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${MAPBOX_TOKEN}&limit=5&language=fr`)
        const data = await res.json()
        setAddressSuggestions(data.features || [])
      } catch { setAddressSuggestions([]) }
      finally { setAddressSearching(false) }
    }, 500)
    return () => clearTimeout(t)
  }, [deliveryAddress])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressSuggestionsRef.current && !addressSuggestionsRef.current.contains(e.target as Node)) setAddressSuggestions([])
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const onSubmit = (data: UpdateDeliveryFormInput) => {
    onSave({ ...data, driverId: data.driverId || null, vehicleId: data.vehicleId || null })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative bg-surface border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-main">Modifier la livraison {delivery.trackingId}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-text-muted hover:bg-border hover:text-text-main"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Statut</label>
            <select {...register('status')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-1">Chauffeur</label>
              <select {...register('driverId')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary"><option value="">Non assigné</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-1">Véhicule</label>
              <select {...register('vehicleId')} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary"><option value="">Non assigné</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Client</label>
            <input type="text" {...register('recipientCompany')} placeholder="Nom du client" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="relative">
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Adresse de livraison <span className="text-red-400">*</span></label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" {...register('deliveryAddress')} className="w-full bg-background border border-border rounded-lg text-sm text-text-main pl-10 p-2.5 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Commencez à taper une adresse..." autoComplete="off" />
              {addressSearching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted animate-pulse">Recherche…</span>}
            </div>
            {addressSuggestions.length > 0 && (
              <div ref={addressSuggestionsRef} className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                {addressSuggestions.map((r) => (
                  <button key={r.id} type="button" className="w-full text-left px-4 py-3 text-sm text-text-main hover:bg-border transition-colors border-b border-border last:border-0" onClick={() => { setValue('deliveryAddress', r.place_name); setAddressSuggestions([]) }}>{r.place_name}</button>
                ))}
              </div>
            )}
            {!MAPBOX_TOKEN && <p className="text-[10px] text-amber-500 mt-1">Configurez le token Mapbox.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-1">Contact</label>
              <input type="text" {...register('contactName')} placeholder="Nom" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-1">Téléphone</label>
              <input type="text" {...register('contactPhone')} placeholder="Tél" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </form>
        <div className="p-6 border-t border-border flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold border border-border bg-background text-text-main hover:bg-border transition-colors">Annuler</button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={saving} className="flex-1 py-3 rounded-xl font-bold bg-primary text-[#020617] hover:bg-primaryHover disabled:opacity-50 flex items-center justify-center gap-2 transition-all"><Save size={18} /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  )
}
