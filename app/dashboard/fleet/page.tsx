'use client';

import React, { useState, useMemo } from 'react';
import { 
  Truck, MapPin, Bell, Plus, Search, Filter, Star, 
  MoreVertical, ChevronLeft, ChevronRight, X, User, Phone, Hash
} from 'lucide-react';

// --- TYPES & MOCK DATA ---
const INITIAL_DRIVERS = [
  { id: 'DRV-8832', name: 'John Doe', status: 'Active', location: 'Brooklyn, NY', deliveries: 12, rating: 4.8, avatar: 'https://i.pravatar.cc/150?u=8' },
  { id: 'DRV-1294', name: 'Sarah Smith', status: 'Idle', location: 'Queens, NY', deliveries: 0, rating: 4.9, avatar: 'https://i.pravatar.cc/150?u=10' },
  { id: 'DRV-5671', name: 'Mike Ross', status: 'Active', location: 'Manhattan, NY', deliveries: 8, rating: 4.7, avatar: 'https://i.pravatar.cc/150?u=11' },
  { id: 'DRV-3390', name: 'Lisa Wong', status: 'Maintenance', location: 'Jersey City, NJ', deliveries: 0, rating: 5.0, avatar: 'https://i.pravatar.cc/150?u=12' },
  { id: 'DRV-9821', name: 'Emily Chen', status: 'Active', location: 'Bronx, NY', deliveries: 15, rating: 4.9, avatar: 'https://i.pravatar.cc/150?u=13' },
];

export default function FleetPage() {
  // --- ÉTATS ---
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // --- LOGIQUE DE FILTRAGE ---
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            driver.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || driver.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  // --- ACTIONS ---
  const handleAddDriver = (newDriver: any) => {
    setDrivers([newDriver, ...drivers]);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-white">
      {/* HEADER FONCTIONNEL */}
      <header className="flex items-center justify-between  px-8 py-5 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion de Flotte</h2>
          <p className="text-text-muted text-sm">Conducteurs opérationnels : {drivers.filter(d => d.status === 'Active').length}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setNotifications(0)}
            className="relative p-2.5 text-text-muted hover:bg-slate-800 rounded-xl transition-all"
          >
            <Bell size={22} />
            {notifications > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full ">
                {notifications}
              </span>
            )}
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-slate-900 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={20} />
            <span>Nouveau Chauffeur</span>
          </button>
        </div>
      </header>

      <div className="p-8 space-y-6 overflow-y-auto">
        {/* FILTRES & RECHERCHE FONCTIONNELS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F172A] p-4 rounded-2xl border border-white/5 shadow-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Rechercher par nom ou ID..."
              className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
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
                  ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {status === 'All' ? 'Tous' : status}
              </button>
            ))}
          </div>
        </div>

        {/* TABLEAU DYNAMIQUE */}
        <div className="bg-[#0F172A] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-white/5">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Chauffeur</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Statut</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Position</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Livraisons</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Note</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                         <img src={driver.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{driver.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{driver.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={driver.status} />
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin size={14} className="text-primary" /> {driver.location}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold">{driver.deliveries}</span>
                      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(driver.deliveries * 5, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-bold text-white">{driver.rating}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredDrivers.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-medium">
              Aucun chauffeur trouvé pour "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CRÉATION (STYLE REGISTER/LOGIN) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#0B0F1A]/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#0F172A] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold italic tracking-tight">Nouveau Chauffeur</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddDriver({
                id: `DRV-${Math.floor(Math.random() * 9000 + 1000)}`,
                name: formData.get('name'),
                status: 'Active',
                location: formData.get('city'),
                deliveries: 0,
                rating: 5.0,
                avatar: `https://i.pravatar.cc/150?u=${Math.random()}`
              });
            }}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-slate-600" size={16} />
                  <input name="name" required placeholder="ex: Marc Dupont" className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 pl-10 text-white focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Ville de base</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-slate-600" size={16} />
                    <input name="city" required placeholder="ex: Lyon" className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 pl-10 text-white focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-slate-600" size={16} />
                    <input name="phone" required type="tel" placeholder="+33..." className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 pl-10 text-white focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-primary text-slate-900 py-4 rounded-xl font-bold text-sm mt-4 hover:bg-primaryHover transition-all shadow-lg shadow-primary/10">
                Enregistrer le chauffeur
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SOUS-COMPOSANTS ---
function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Idle: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Maintenance: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[status]}`}>
      ● {status}
    </span>
  );
}