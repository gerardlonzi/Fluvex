'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin, Bell, Plus, Search, Download,
  MoreVertical, UserCircle, Trash2,
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

export default function FleetPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/drivers', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Array<{ id: string; code: string; name: string; status: string; region: string | null; avatarUrl: string | null; vehicle: { name: string } | null }>) => {
        setDrivers(
          data.map((d) => ({
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
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown[]) => setUnreadAlerts(data.length));
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

  const handleRemoveDriver = (driverId: string) => {
    if (typeof window === 'undefined' || !window.confirm('Supprimer ce chauffeur de la flotte ?')) {
      setOpenDropdownId(null);
      return;
    }
    fetch(`/api/drivers/${driverId}`, { method: 'DELETE', credentials: 'include' })
      .then((res) => {
        if (res.ok) setDrivers((prev) => prev.filter((d) => d.id !== driverId));
      })
      .finally(() => setOpenDropdownId(null));
  };

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    await downloadExport('/api/export/drivers?format=csv', 'chauffeurs.csv');
    setExporting(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-white">
      {/* HEADER FONCTIONNEL */}
      <header className="flex items-center justify-between  px-8 py-5 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion de Flotte</h2>
          <p className="text-text-muted text-sm">Conducteurs opérationnels : {drivers.filter((d) => d.status === 'ACTIVE').length}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative p-2.5 text-text-muted hover:bg-border rounded-xl transition-all"
          >
            <Bell size={22} />
            {unreadAlerts > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full ">
                {unreadAlerts}
              </span>
            )}
          </button>
          <button type="button" onClick={handleExport} disabled={exporting} className="flex items-center gap-2 border border-border bg-surface hover:bg-border text-text-main px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-70">
            <Download size={18} />
            {exporting ? 'Export...' : 'Exporter'}
          </button>
          <Link href="/dashboard/fleet/new" className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-background px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95">
            <Plus size={20} />
            Ajouter un chauffeur
          </Link>
        </div>
      </header>
      <div className="p-8 space-y-6 overflow-y-auto">
        {/* FILTRES & RECHERCHE FONCTIONNELS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border shadow-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text"
              placeholder="Rechercher par nom ou ID..."
              className="w-full bg-border/50 border border-border rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
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

        {/* TABLEAU DYNAMIQUE */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-2xl">
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
                          <span className="text-text-muted text-sm font-bold">{driver.name.slice(0, 2).toUpperCase()}</span>
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
                        aria-expanded={openDropdownId === driver.id}
                        aria-haspopup="true"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openDropdownId === driver.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] py-1 bg-surface border border-border rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150">
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
                            onClick={() => handleRemoveDriver(driver.id)}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                          >
                            <Trash2 size={16} />
                            Supp le Chauffeur
                          </button>
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


    </div>
  );
}

// --- SOUS-COMPOSANTS ---
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