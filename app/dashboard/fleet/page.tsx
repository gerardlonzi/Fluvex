'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useToast } from '@/src/components/ui/toast';
import Link from 'next/link';
import {
  MapPin, Bell, Plus, Search, Download,
  MoreVertical, UserCircle, Trash2, Loader2, X,
} from 'lucide-react';
import { downloadExport } from '@/utils/downloadExport';

// --- TYPES ---
type DriverRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  region: string | null;
  vehicleName: string | null;
  avatarUrl: string | null;
};

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
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null); // Pour la modale de suppression
  const { showError, showSuccess } = useToast();


  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chargement des chauffeurs (inchangé)
  useEffect(() => {
    fetch('/api/drivers', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setDrivers(
          data.map((d: any) => ({
            id: d.id,
            code: d.code,
            name: d.name,
            status: d.status,
            region: d.region ?? null,
            vehicleName: d.vehicle?.name ?? null,
            avatarUrl: d.avatarUrl ?? null,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/alerts?unreadOnly=true', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []));
  }, []);

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
        showSuccess("status modifier avec success")
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
      {/* HEADER (inchangé) */}
      <header className="flex items-center justify-between px-8 py-5 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion de Flotte</h2>
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
            Ajouter un chauffeur
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
                  <th className="p-4 text-xs font-bold text-text-muted uppercase">Région / Véhicule</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-border/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
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
                        <MapPin size={14} className="text-primary" /> {driver.region || driver.vehicleName || '—'}
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

      {/* Modale de confirmation de suppression - centrée et jolie */}
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