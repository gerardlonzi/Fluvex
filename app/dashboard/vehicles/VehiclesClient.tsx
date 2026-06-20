'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/src/components/ui/toast'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Truck, Plus, Search, Download, MoreVertical, Pencil, Trash2, X, Save,
} from 'lucide-react'
import { downloadExport } from '@/utils/downloadExport'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { updateVehicle, deleteVehicle } from './actions'
import { DateRangePicker, dateRangeQuery } from '@/src/components/ui/date-range-picker'

type VehicleRow = {
  id: string
  name: string
  plateNumber: string | null
  status: string
  createdAt: string
}

type VehicleFromServer = {
  id: string
  name: string
  plateNumber: string | null
  status: string
  createdAt: Date | string
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  MAINTENANCE: 'Maintenance',
  INACTIVE: 'Inactif',
}

const STATUS_OPTIONS = ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] as const

function getStatusColor(status: string): string {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-primary/10 text-primary border-primary/20',
    MAINTENANCE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    INACTIVE: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  }
  return styles[status] ?? 'bg-border text-text-muted'
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(status)}`}>
      ● {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function mapVehicle(v: VehicleFromServer): VehicleRow {
  return {
    id: v.id,
    name: v.name,
    plateNumber: v.plateNumber ?? null,
    status: v.status,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : v.createdAt?.toISOString?.() ?? '',
  }
}

export default function VehiclesClient({
  initialVehicles,
  initialFrom,
  initialTo,
  companyCreatedAt,
}: {
  initialVehicles: VehicleFromServer[]
  initialFrom: string | null
  initialTo: string | null
  companyCreatedAt: string
}) {
  const { showError, showSuccess } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<VehicleRow[]>(() => initialVehicles.map(mapVehicle))
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPlateNumber, setEditPlateNumber] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [exporting, setExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const range = useMemo(() => dateRangeQuery.parse(searchParams), [searchParams])

  useEffect(() => {
    if (editVehicleId) {
      const v = vehicles.find((x) => x.id === editVehicleId)
      if (v) {
        setEditName(v.name)
        setEditPlateNumber(v.plateNumber ?? '')
        setEditStatus(v.status)
      }
    }
  }, [editVehicleId, vehicles])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.plateNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [vehicles, searchQuery, statusFilter])

  const handleChangeStatus = async (vehicleId: string, newStatus: string) => {
    setUpdatingStatus(vehicleId)
    const previous = vehicles
    setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v)))
    setOpenDropdownId(null)
    try {
      await updateVehicle(vehicleId, { status: newStatus })
      showSuccess('Statut mis à jour.')
    } catch {
      setVehicles(previous)
      showError('Erreur lors de la mise à jour.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editVehicleId) return
    setSavingEdit(true)
    const previous = vehicles
    const name = editName.trim()
    const plateNumber = editPlateNumber.trim() || null
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === editVehicleId ? { ...v, name, plateNumber, status: editStatus } : v
      )
    )
    setEditVehicleId(null)
    try {
      await updateVehicle(editVehicleId, { name, plateNumber, status: editStatus })
      showSuccess('Véhicule mis à jour.')
    } catch {
      setVehicles(previous)
      setEditVehicleId(editVehicleId)
      showError('Erreur lors de la mise à jour.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    setDeletingId(deleteConfirmId)
    const previous = vehicles
    setVehicles((prev) => prev.filter((v) => v.id !== deleteConfirmId))
    const idToDelete = deleteConfirmId
    setDeleteConfirmId(null)
    try {
      await deleteVehicle(idToDelete)
      showSuccess('Véhicule supprimé.')
    } catch {
      setVehicles(previous)
      showError('Erreur lors de la suppression.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    await downloadExport('/api/export/vehicles?format=csv', 'vehicules.csv')
    setExporting(false)
  }

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
      <header className="border-b border-border bg-background/50 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-main">Gestion des véhicules</h1>
              <p className="text-text-muted text-sm">
                {vehicles.filter((v) => v.status === 'ACTIVE').length} véhicule(s) actif(s)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 border border-border bg-surface hover:bg-border text-text-main px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-70"
              >
                <Download size={18} />
                Exporter
              </button>
              <Link
                href="/dashboard/vehicles/new"
                className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-[#020617] font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(19,236,91,0.2)]"
              >
                <Plus size={20} />
                Ajouter un véhicule
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div className="max-w-md">
          <DateRangePicker
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
              router.push(qs ? `/dashboard/vehicles?${qs}` : '/dashboard/vehicles')
            }}
          />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border shadow-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom ou immatriculation..."
              className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {['All', 'ACTIVE', 'MAINTENANCE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20'
                    : 'bg-border text-text-muted hover:text-text-main border border-border'
                }`}
              >
                {status === 'All' ? 'Tous' : STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border  shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-border/50 border-b border-border">
                <th className="p-4 text-xs font-bold text-text-muted uppercase">Véhicule</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase">Immatriculation</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-border/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-bold text-sm">{vehicle.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-text-muted font-mono text-sm">{vehicle.plateNumber || '—'}</td>
                  <td className="p-4">
                    <StatusBadge status={vehicle.status} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="relative inline-block" ref={openDropdownId === vehicle.id ? dropdownRef : undefined}>
                      <button
                        type="button"
                        onClick={() => setOpenDropdownId(openDropdownId === vehicle.id ? null : vehicle.id)}
                        className="p-2 text-text-muted hover:text-text-main hover:bg-border rounded-lg"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openDropdownId === vehicle.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] py-1 bg-surface border border-border rounded-xl shadow-xl">
                          {STATUS_OPTIONS.filter((s) => s !== vehicle.status).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleChangeStatus(vehicle.id, s)}
                              disabled={updatingStatus === vehicle.id}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text-main hover:bg-border"
                            >
                              Passer à {STATUS_LABELS[s]}
                            </button>
                          ))}
                          <div className="border-t border-border my-1" />
                          <button
                            type="button"
                            onClick={() => { setEditVehicleId(vehicle.id); setOpenDropdownId(null); }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text-main hover:bg-border"
                          >
                            <Pencil size={16} className="text-primary" />
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeleteConfirmId(vehicle.id); setOpenDropdownId(null); }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVehicles.length === 0 && (
            <div className="p-12 text-center text-text-muted font-medium">
              {searchQuery || statusFilter !== 'All'
                ? 'Aucun véhicule trouvé'
                : 'Aucun véhicule. Ajoutez-en un pour commencer.'}
            </div>
          )}
        </div>
      </div>

      {editVehicleId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-bold">Modifier le véhicule</h3>
              <button type="button" onClick={() => setEditVehicleId(null)} className="p-2 rounded-lg text-text-muted hover:bg-border hover:text-text-main">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Nom</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main" placeholder="ex. Renault Master" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Immatriculation</label>
                <input type="text" value={editPlateNumber} onChange={(e) => setEditPlateNumber(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main" placeholder="ex. AB-123-CD" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Statut</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button type="button" onClick={() => setEditVehicleId(null)} className="flex-1 py-3 rounded-xl font-semibold border border-border bg-background text-text-main hover:bg-border">
                Annuler
              </button>
              <button type="button" onClick={handleSaveEdit} disabled={savingEdit} className="flex-1 py-3 rounded-xl font-bold bg-primary text-slate-950 hover:bg-primaryHover disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={18} />
                {savingEdit ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
        loading={!!deletingId}
      />
    </div>
  )
}
