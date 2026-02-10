'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, Calendar, Filter, ArrowUpDown, Download, 
  ChevronRight, ChevronLeft, Truck, CheckCircle, 
  Clock, AlertTriangle, MoreVertical, MapPin, 
  Phone, User, X, Package, ShieldCheck,
  Plus
} from 'lucide-react';

// --- DONNÉES DE DÉMO ---
const DELIVERIES = [
  { id: 'TRK-8821', client: 'Tech Solutions Inc.', status: 'En Transit', driver: 'Marc D.', dest: '12 Rue de la Paix, Paris', time: '14:30', eta: 'À l\'heure', items: 12, weight: '450kg' },
  { id: 'TRK-8822', client: 'Global Bistro', status: 'Chargement', driver: 'Sarah J.', dest: '45 Av. Champs-Élysées', time: '16:00', eta: 'Retard +15m', items: 4, weight: '120kg' },
  { id: 'TRK-8823', client: 'Urban Market', status: 'En Attente', driver: 'Non assigné', dest: '88 Rue de Rivoli, Paris', time: 'Demain 09:00', eta: 'Planifié', items: 85, weight: '1.2t' },
  { id: 'TRK-8824', client: 'Bio Fresh Ltd.', status: 'En Transit', driver: 'Leo K.', dest: '22 Blvd Haussmann', time: '15:45', eta: 'À l\'heure', items: 24, weight: '300kg' },
  { id: 'TRK-8825', client: 'Retail Express', status: 'Problème', driver: 'David M.', dest: '10 Av. Montaigne', time: '13:00', eta: 'Trafic Intense', items: 2, weight: '50kg' },
];

export default function DeliveryDashboard() {
  const [selectedDelivery, setSelectedDelivery] = useState<typeof DELIVERIES[0] | null>(null);

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En Transit': return 'bg-primary/10 text-primary border-primary/20';
      case 'Chargement': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'En Attente': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Problème': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col relative overflow-hidden">
      
      {/* HEADER */}
      <header className="border-b border-border bg-background/50 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 text-sm mb-2 text-text-muted">
            <a href="#" className="hover:text-primary transition-colors">Accueil</a>
            <ChevronRight size={14} />
            <span className="text-text-main font-medium">Logistique</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-main">Centre de Gestion des Livraisons</h1>
              <p className="text-text-muted text-sm">Gérez, suivez et optimisez vos opérations en temps réel.</p>
            </div>
            <Link rel="stylesheet" href="/dashboard/deliveries/new"  className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-[#020617] font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(19,236,91,0.2)]">
            <Plus className="text-xl leading-none" />
            <span>Nouvelle Livraison</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 overflow-y-auto">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Livraisons Actives" value="12" trend="+2%" icon={<Truck className="text-primary" />} />
          <StatCard title="Terminées Aujourd'hui" value="45" trend="+12%" icon={<CheckCircle className="text-accent" />} />
          <StatCard title="En Attente" value="8" trend="-5%" isNegative icon={<Clock className="text-yellow-500" />} />
          <StatCard title="Problèmes Signalés" value="2" trend="0%" icon={<AlertTriangle className="text-danger" />} />
        </div>

        {/* TABLE SECTION */}
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          
          {/* TABS & TOOLBAR */}
          <div className="border-b border-border px-6 flex items-center justify-between bg-surface/50">
            <div className="flex gap-6">
              <TabButton active label="Actives" count="12" />
              <TabButton label="Terminées" count="45" />
              <TabButton label="Annulées" count="2" />
            </div>
          </div>
          
          <div className="p-4 border-b border-border flex flex-col lg:flex-row gap-4 justify-between bg-surface">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher par ID, Client ou Chauffeur..." 
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex gap-3">
              <ToolbarButton icon={<Filter size={16} />} label="Filtres" />
              <ToolbarButton icon={<Calendar size={16} />} label="Date" />
              <ToolbarButton icon={<Download size={16} />} label="Exporter" highlight />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
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
                {DELIVERIES.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedDelivery(item)}
                    className={`group hover:bg-border/30 cursor-pointer transition-colors ${selectedDelivery?.id === item.id ? 'bg-border/40' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono font-medium text-text-main">{item.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs font-bold text-text-main">
                          {item.client.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-text-main">{item.client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center">
                            <User size={12} />
                         </div>
                         {item.driver}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted max-w-[200px] truncate">{item.dest}</td>
                    <td className="px-6 py-4">
                      <div className="text-text-main font-medium">{item.time}</div>
                      <div className={`text-xs ${item.eta.includes('Retard') || item.eta.includes('Trafic') ? 'text-danger' : 'text-text-muted'}`}>{item.eta}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-border rounded-full text-text-muted hover:text-primary transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* PAGINATION */}
          <div className="bg-background/50 px-6 py-3 border-t border-border flex items-center justify-between">
            <p className="text-sm text-text-muted">Affichage de <span className="text-text-main font-bold">1</span> à <span className="text-text-main font-bold">5</span> sur <span className="text-text-main font-bold">12</span> résultats</p>
            <div className="flex gap-1">
              <button className="p-1 rounded hover:bg-border text-text-muted"><ChevronLeft size={20}/></button>
              <button className="p-1 px-3 rounded bg-primary/20 text-primary font-bold text-sm border border-primary/30">1</button>
              <button className="p-1 px-3 rounded hover:bg-border text-text-muted text-sm">2</button>
              <button className="p-1 rounded hover:bg-border text-text-muted"><ChevronRight size={20}/></button>
            </div>
          </div>
        </div>
      </main>

      {/* OVERLAY & DRAWER (PANNEAU DROIT) */}
      {selectedDelivery && (
        <>
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm z-30 transition-opacity duration-300"
            onClick={() => setSelectedDelivery(null)}
          />
          <aside className="absolute top-0 right-0 h-full w-full max-w-[500px] bg-surface shadow-2xl z-40 border-l border-border transform transition-transform duration-300 animate-in slide-in-from-right flex flex-col">
            
            {/* DRAWER HEADER */}
            <div className="flex flex-col gap-4 p-6 border-b border-border bg-surface">
              <div className="flex items-start justify-between">
                <div>
                   <div className="flex items-center gap-3 mb-1">
                     <h2 className="text-2xl font-bold text-text-main">{selectedDelivery.id}</h2>
                     <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(selectedDelivery.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>
                        {selectedDelivery.status}
                     </span>
                   </div>
                   <p className="text-text-muted text-sm">Standard Logistics • Zone 4B</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-border rounded-lg text-text-muted transition-colors"><MoreVertical size={20}/></button>
                  <button onClick={() => setSelectedDelivery(null)} className="p-2 hover:bg-border rounded-lg text-text-main transition-colors"><X size={20}/></button>
                </div>
              </div>
            </div>

            {/* DRAWER CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* MAP PLACEHOLDER */}
              <div className="rounded-xl overflow-hidden border border-border h-48 bg-background relative group">
                <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-74.006,40.7128,12/400x200?access_token=YOUR_TOKEN')] bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <button className="bg-primary hover:bg-primaryHover text-[#020617] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
                    <MapPin size={14} /> Suivre en direct
                  </button>
                </div>
              </div>

              {/* TIMELINE */}
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Chronologie</h3>
                <div className="space-y-6 relative pl-2">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border"></div>
                  
                  {/* Step 1 */}
                  <div className="relative flex gap-4">
                    <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-surface z-10 mt-1"></div>
                    <div>
                      <p className="text-text-main font-medium text-sm">Commande en cours de livraison</p>
                      <p className="text-text-muted text-xs">Aujourd'hui, 14:15 • Porte Maillot</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex gap-4">
                    <div className="w-4 h-4 rounded-full bg-border ring-4 ring-surface z-10 mt-1"></div>
                    <div>
                      <p className="text-text-muted font-medium text-sm">Départ de l'entrepôt</p>
                      <p className="text-text-muted text-xs">Aujourd'hui, 13:00 • Entrepôt Nord</p>
                    </div>
                  </div>

                   {/* Step 3 */}
                   <div className="relative flex gap-4">
                    <div className="w-4 h-4 rounded-full bg-border ring-4 ring-surface z-10 mt-1"></div>
                    <div>
                      <p className="text-text-muted font-medium text-sm">Commande confirmée</p>
                      <p className="text-text-muted text-xs">Hier, 18:30 • Système</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILS CARDS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background border border-border p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-text-muted text-xs uppercase font-bold">
                    <User size={14} /> Chauffeur
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border"></div>
                    <div>
                      <div className="text-sm font-bold text-text-main">{selectedDelivery.driver}</div>
                      <div className="text-xs text-text-muted">4.9 ★</div>
                    </div>
                    <button className="ml-auto bg-border p-1.5 rounded-lg text-primary hover:bg-primary hover:text-black transition-colors">
                      <Phone size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-background border border-border p-4 rounded-xl">
                   <div className="flex items-center gap-2 mb-2 text-text-muted text-xs uppercase font-bold">
                    <Package size={14} /> Cargaison
                  </div>
                  <p className="text-text-main font-bold text-lg">{selectedDelivery.items} <span className="text-sm font-normal text-text-muted">colis</span></p>
                  <p className="text-text-muted text-xs">Poids total: {selectedDelivery.weight}</p>
                </div>
              </div>

              {/* CUSTOMER INFO */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Client</h3>
                  <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    <ShieldCheck size={12}/> Compte Vérifié
                  </span>
                </div>
                <div className="bg-background border border-border p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-text-main font-bold">{selectedDelivery.client}</div>
                    <div className="text-text-muted text-xs mt-1">{selectedDelivery.dest}</div>
                  </div>
                  <button className="text-xs border border-border bg-surface text-text-main px-3 py-1.5 rounded-lg hover:bg-border transition-colors">
                    Détails
                  </button>
                </div>
              </div>

            </div>

            {/* DRAWER FOOTER */}
            <div className="p-6 border-t border-border bg-background flex gap-3">
              <button className="flex-1 bg-surface border border-border text-text-main font-bold py-3 rounded-xl hover:bg-border transition-colors">
                Signaler un problème
              </button>
              <button className="flex-1 bg-primary text-[#020617] font-bold py-3 rounded-xl hover:bg-primaryHover transition-colors shadow-[0_0_15px_rgba(19,236,91,0.2)]">
                Voir Preuve de Livraison
              </button>
            </div>
          </aside>
        </>
      )}

    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function StatCard({ title, value, trend, isNegative, icon }: any) {
  return (
    <div className="flex flex-col gap-1 rounded-xl p-5 border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm font-medium">{title}</p>
        <div className="bg-background p-2 rounded-lg border border-border">{icon}</div>
      </div>
      <div className="flex items-end gap-2 mt-2">
        <p className="text-3xl font-extrabold text-text-main">{value}</p>
        <span className={`text-sm font-bold mb-1 flex items-center ${isNegative ? 'text-danger' : 'text-primary'}`}>
          <ArrowUpDown size={12} className="mr-1" /> {trend}
        </span>
      </div>
    </div>
  );
}

function TabButton({ label, count, active }: any) {
  return (
    <button className={`pb-4 px-1 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${active ? 'border-primary text-text-main' : 'border-transparent text-text-muted hover:text-text-main'}`}>
      {label}
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-primary/20 text-primary' : 'bg-border text-text-muted'}`}>
        {count}
      </span>
    </button>
  );
}

function ToolbarButton({ icon, label, highlight }: any) {
  return (
    <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${highlight ? 'border-transparent bg-primary text-[#020617] hover:bg-primaryHover' : 'border-border bg-background text-text-main hover:bg-border'}`}>
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}