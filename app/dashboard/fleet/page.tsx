'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useToast } from '@/src/components/ui/toast';
import Link from 'next/link';
import {
  MapPin, Plus, Search, Download,
  MoreVertical, UserCircle, Trash2, X, Pencil, Truck, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { downloadExport } from '@/utils/downloadExport';

// --- TYPES ---
type DriverRow = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  status: string;
  region: string | null;
  vehicleName: string | null;
  vehicleId: string | null;
  avatarUrl: string | null;
  licenseExpiry: string | null;
};

type VehicleOption = { id: string; name: string; plateNumber: string | null };

const STATUS_DISPLAY: Record<string, string> = {
  ACTIVE: 'Active',
  IDLE: 'Idle',
  MAINTENANCE: 'Maintenance',
};

const STATUS_OPTIONS = ['ACTIVE', 'IDLE', 'MAINTENANCE'] as const;

export default function FleetPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [editDriverId, setEditDriverId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editVehicleId, setEditVehicleId] = useState('');
  const [editLicenseExpiry, setEditLicenseExpiry] = useState('');
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const { showError, showSuccess } = useToast();


  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/alerts/check-expirations', { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);

  // Chargement des chauffeurs
  useEffect(() => {
    fetch('/api/drivers', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setDrivers(
          data.map((d: { id: string; code: string; name: string; status: string; region?: string | null; vehicle?: { name: string } | null; vehicleId?: string | null; avatarUrl?: string | null; licenseExpiry?: string | Date | null }) => ({
            id: d.id,
            code: d.code,
            name: d.name,
            email: (d as { email?: string }).email ?? '',
            phone: (d as { phone?: string | null }).phone ?? null,
            role: (d as { role?: string | null }).role ?? null,
            status: d.status,
            region: d.region ?? null,
            vehicleName: d.vehicle?.name ?? null,
            vehicleId: (d as { vehicleId?: string | null; vehicle?: { id: string } }).vehicleId ?? (d as { vehicle?: { id: string } }).vehicle?.id ?? null,
            avatarUrl: d.avatarUrl ?? null,
            licenseExpiry: d.licenseExpiry ? String(d.licenseExpiry).slice(0, 10) : null,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/vehicles', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: VehicleOption[]) => setVehicles(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (editDriverId) {
      const d = drivers.find((x) => x.id === editDriverId);
      if (d) {
        setEditName(d.name);
        setEditEmail(d.email);
        setEditPhone(d.phone ?? '');
        setEditRole(d.role ?? '');
        setEditStatus(d.status);
        setEditRegion(d.region ?? '');
        setEditVehicleId(d.vehicleId ?? '');
        setEditLicenseExpiry(d.licenseExpiry ?? '');
      }
      setEditModalError(null);
      setEditFieldErrors({});
    }
  }, [editDriverId, drivers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch =
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.code.toLowerCase().includes(searchQuery.toLowerCase());
      const displayStatus = STATUS_DISPLAY[driver.status] ?? driver.status;
      const matchesStatus = statusFilter === 'All' || displayStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  // Suppression avec modale
  const handleRemoveDriver = async (driverId: string) => {
    setDeleteModalId(driverId);
    setOpenDropdownId(null);
  };

  const confirmDelete = async () => {
    if (!deleteModalId) return;

    try {
      const res = await fetch(`/api/drivers/${deleteModalId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setDrivers((prev) => prev.filter((d) => d.id !== deleteModalId));
        showSuccess("Chauffeur supprimer avec success")
      } else {
        showError("Erreur lors de la suppression")
      }
    } catch (err) {
      showError("Erreur réseau")
    } finally {
      setDeleteModalId(null);
    }
  };

  // Changement de statut
  const handleChangeStatus = async (driverId: string, newStatus: string) => {
    setUpdatingStatus(driverId);

    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setDrivers((prev) =>
          prev.map((d) => (d.id === driverId ? { ...d, status: newStatus } : d))
        );
        showSuccess("Statut du chauffeur enregistré en base de données.")
      } else {
        showError("Erreur lors de la mise à jour du statut")
      }
    } catch (err) {
      showError("Erreur réseau")
    } finally {
      setUpdatingStatus(null);
      setOpenDropdownId(null);
    }
  };

  const handleExport = async () => {
    await downloadExport('/api/export/drivers?format=csv', 'chauffeurs.csv');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-white">
      {/* HEADER */}
      <header className="flex items-center justify-between px-8 py-5 backdrop-blur-md border-b border-border">
        <div>
          
          <h2 className="text-2xl font-bold tracking-tight text-text-main">Gestion de Flotte</h2>
          <p className="text-text-muted text-sm">
            Conducteurs opérationnels : {drivers.filter((d) => d.status === 'ACTIVE').length}
          </p>
        </div>

        <div className="flex items-center gap-4">
          
          <button type="button" className="relative p-2.5 text-text-muted hover:bg-border rounded-xl transition-all"></button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 border border-border bg-surface hover:bg-border text-text-main px-4 py-2.5 rounded-xl font-bold transition-all"
          >
            <Download size={18} />
            Exporter
          </button>
          <Link
            href="/dashboard/fleet/new"
            className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-background px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={20} />
            
          </Link>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* FILTRES (inchangé) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border shadow-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom ou ID..."
              className="w-full bg-border/50 border bg-transparent border-border rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {['All', 'Active', 'Idle', 'Maintenance'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-background shadow-lg shadow-primary/20'
                    : 'bg-border text-text-muted hover:text-text-main border border-border'
                }`}
              >
                {status === 'All' ? 'Tous' : status}
              </button>
            ))}
          </div>
        </div>

        {/* TABLEAU */}
        <div className="bg-surface rounded-2xl border border-border overflow-visible shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-text-muted">Chargement des chauffeurs...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-border/50 border-b border-border">
                  <th className="p-4 text-xs font-bold text-text-muted uppercase">Chauffeur</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase">Statut</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase">Région</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase">Véhicule</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-border/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {driver.licenseExpiry && new Date(driver.licenseExpiry) < new Date() && (
                          <span title="Permis expiré"><AlertTriangle size={16} className="text-danger shrink-0" /></span>
                        )}
                        <div className="w-10 h-10 rounded-full bg-border border border-border flex items-center justify-center overflow-hidden">
                          {driver.avatarUrl ? (
                            <img src={driver.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-text-muted text-sm font-bold">
                              {driver.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{driver.name}</div>
                          <div className="text-[10px] text-text-muted font-mono">{driver.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={driver.status} />
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin size={14} className="text-primary shrink-0" />
                          <span>Région: {driver.region || '—'}</span>
                        </div>
                        
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Truck size={14} className="text-primary shrink-0" />
                          <span>Véhicule: {driver.vehicleName || '—'}</span>
                        </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="relative inline-block" ref={openDropdownId === driver.id ? dropdownRef : undefined}>
                        <button
                          type="button"
                          onClick={() => setOpenDropdownId(openDropdownId === driver.id ? null : driver.id)}
                          className="p-2 text-text-muted hover:text-text-main hover:bg-border rounded-lg transition-all"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openDropdownId === driver.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] py-1 bg-surface border border-border rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150">
                            <Link
                              href={`/dashboard/drivers?driver=${encodeURIComponent(driver.id)}`}
                              onClick={() => setOpenDropdownId(null)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-main hover:bg-border transition-colors"
                            >
                              <UserCircle size={16} className="text-primary" />
                              Voir stats & profil
                            </Link>
                            <button
                              type="button"
                              onClick={() => { setEditDriverId(driver.id); setOpenDropdownId(null); }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text-main hover:bg-border transition-colors"
                            >
                              <Pencil size={16} className="text-primary" />
                              Modifier
                            </button>

                            {/* Sélecteur de statut (options) */}
                            <div className="px-4 py-2 border-t border-border mt-1">
                              <label className="block text-left text-xs text-text-muted uppercase font-semibold mb-1">
                                Changer statut
                              </label>
                              <select
                                value={driver.status}
                                onChange={(e) => handleChangeStatus(driver.id, e.target.value)}
                                disabled={updatingStatus === driver.id}
                                className="w-full bg-surface border border-border rounded-lg py-2  text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {updatingStatus === driver.id && driver.status === status ? 'Mise à jour...' : STATUS_DISPLAY[status]}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Bouton suppression */}
                            <div className="border-t border-border mt-1 pt-1">
                              <button
                                type="button"
                                onClick={() => handleRemoveDriver(driver.id)}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                              >
                                <Trash2 size={16} />
                                Supprimer le chauffeur
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredDrivers.length === 0 && (
            <div className="p-12 text-center text-text-muted font-medium">
              {searchQuery || statusFilter !== 'All' ? `Aucun chauffeur trouvé` : 'Aucun chauffeur. Ajoutez-en un pour commencer.'}
            </div>
          )}
        </div>
      </div>

      {/* Modale de confirmation de suppression */}
      {deleteModalId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold mb-4">Confirmer la suppression</h3>
            <p className="text-text-muted mb-8">
              Êtes-vous sûr de vouloir supprimer ce chauffeur ? Cette action est irréversible.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setDeleteModalId(null)}
                className="px-6 py-3 bg-border hover:bg-border/80 text-white rounded-xl font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 bg-danger hover:bg-danger/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-danger/20"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Modifier chauffeur */}
      {editDriverId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-main">Modifier le chauffeur</h3>
              <button type="button" onClick={() => setEditDriverId(null)} className="p-2 rounded-lg text-text-muted hover:bg-border hover:text-text-main">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {editModalError && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
                  {editModalError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Nom</label>
                <input type="text" value={editName} onChange={(e) => { setEditName(e.target.value); setEditModalError(null); }} placeholder="Nom du chauffeur" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Email</label>
                <input type="email" value={editEmail} onChange={(e) => { setEditEmail(e.target.value); setEditModalError(null); }} placeholder="email@exemple.com" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Téléphone</label>
                <input type="text" value={editPhone} onChange={(e) => { setEditPhone(e.target.value); setEditModalError(null); }} placeholder="+33 6..." className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Rôle</label>
                <input type="text" value={editRole} onChange={(e) => { setEditRole(e.target.value); setEditModalError(null); }} placeholder="Chauffeur, etc." className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Statut</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_DISPLAY[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Région</label>
                <input type="text" value={editRegion} onChange={(e) => { setEditRegion(e.target.value); setEditModalError(null); }} placeholder="Nord, Zone A..." className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Véhicule</label>
                <select value={editVehicleId} onChange={(e) => setEditVehicleId(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main">
                  <option value="">Aucun véhicule</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} {v.plateNumber ? `(${v.plateNumber})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Expiration permis</label>
                <input type="date" value={editLicenseExpiry} onChange={(e) => setEditLicenseExpiry(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main" />
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button type="button" onClick={() => setEditDriverId(null)} className="flex-1 py-3 rounded-xl font-semibold border border-border bg-background text-text-main hover:bg-border">
                Annuler
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={async () => {
                  if (!editDriverId) return;
                  setEditModalError(null);
                  setEditFieldErrors({});
                  setSavingEdit(true);
                  try {
                    const res = await fetch(`/api/drivers/${editDriverId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        name: editName.trim() || undefined,
                        email: editEmail.trim() || undefined,
                        phone: editPhone.trim() || null,
                        role: editRole.trim() || null,
                        status: editStatus || undefined,
                        region: editRegion.trim() || null,
                        vehicleId: editVehicleId || null,
                        licenseExpiry: editLicenseExpiry || null,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok) {
                      const updated = data;
                      setDrivers((prev) =>
                        prev.map((d) =>
                          d.id === editDriverId
                            ? {
                                ...d,
                                name: updated.name ?? d.name,
                                email: updated.email ?? d.email,
                                phone: updated.phone ?? d.phone,
                                role: updated.role ?? d.role,
                                status: updated.status ?? d.status,
                                region: updated.region ?? null,
                                vehicleName: updated.vehicle?.name ?? null,
                                vehicleId: updated.vehicleId ?? updated.vehicle?.id ?? null,
                                licenseExpiry: updated.licenseExpiry ? String(updated.licenseExpiry).slice(0, 10) : d.licenseExpiry,
                              }
                            : d
                        )
                      );
                      setEditDriverId(null);
                      showSuccess('Chauffeur mis à jour.');
                    } else {
                      const errMsg = data?.error || data?.message || 'Erreur lors de la mise à jour.';
                      console.error('[Fleet] Erreur mise à jour chauffeur:', { status: res.status, data, driverId: editDriverId });
                      setEditModalError(errMsg);
                      showError(errMsg);
                    }
                  } catch (err) {
                    console.error('[Fleet] Erreur réseau mise à jour chauffeur:', err);
                    const errMsg = 'Erreur réseau.';
                    setEditModalError(errMsg);
                    showError(errMsg);
                  } finally {
                    setSavingEdit(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-primary text-[#020617] hover:bg-primaryHover disabled:opacity-50"
              >
                {savingEdit ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// StatusBadge inchangé
function StatusBadge({ status }: { status: string }) {
  const display = STATUS_DISPLAY[status] ?? status;
  const styles: Record<string, string> = {
    ACTIVE: 'bg-primary/10 text-primary border-primary/20',
    IDLE: 'bg-accent/10 text-accent border-accent/20',
    MAINTENANCE: 'bg-danger/10 text-danger border-danger/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[status] ?? 'bg-border text-text-muted'}`}>
      ● {display}
    </span>
  );
}