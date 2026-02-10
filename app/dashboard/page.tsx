"use client"

import { ArrowUpRight, ArrowDownRight, Activity, Battery, Zap , Calendar,X, 
  Bell, 
  Settings, 
  AlertTriangle, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  Server, 
  Search,
  Check,
  } from 'lucide-react';
  import Link from 'next/link';
import { useState } from 'react';

// Composant "Atome" pour les cartes de stats
function StatCard({ title, value, change, trend, icon: Icon }: any) {
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
  );
}

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  return <>
  <button onClick={() => setIsOpen(true)}><Bell className="w-6 h-6" /></button>
  {isOpen && (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#020617]/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Panneau Latéral */}
      <div className="relative w-full max-w-md h-full bg-[#0f172a] shadow-2xl border-l border-[#1e293b] flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#f8fafc]">Notifications</h2>
            <span className="bg-[#13ec5b]/10 text-[#13ec5b] text-xs font-bold px-2 py-0.5 rounded-full">3 News</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-[#13ec5b] hover:text-[#10b981] transition-colors">
              Tout marquer comme lu
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Onglets (Tabs) */}
        <div className="px-6 py-3 border-b border-[#1e293b] bg-[#0f172a]">
          <div className="flex space-x-1 bg-[#020617] p-1 rounded-lg w-max border border-[#1e293b]">
            {['Toutes', 'Non lues', 'Archivées'].map((tab, idx) => (
              <button 
                key={tab}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  idx === 0 ? 'bg-[#1e293b] text-[#f8fafc] shadow-sm' : 'text-[#94a3b8] hover:text-[#f8fafc]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          
          {/* Section Aujourd'hui */}
          <div className="px-2 pt-2 pb-1">
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Aujourd'hui</h3>
          </div>

          {/* Alerte Haute Priorité */}
          <div className="group relative bg-[#ef4444]/5 p-4 rounded-xl border border-[#ef4444]/20 hover:border-[#ef4444]/40 transition-all cursor-pointer">
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#13ec5b] ring-4 ring-[#0f172a]"></div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-[#f8fafc]">Panne de véhicule</h4>
                  <span className="text-xs text-[#94a3b8]">Il y a 2m</span>
                </div>
                <p className="text-sm text-[#94a3b8] mb-3 leading-relaxed">
                  Le camion <span className="text-[#f8fafc] font-medium">#402</span> signale une panne moteur sur la <span className="font-medium text-[#f8fafc]">Route 66</span>. Équipe de maintenance dépêchée.
                </p>
                <div className="flex gap-2">
                  <button className="text-xs font-semibold bg-[#1e293b] border border-[#1e293b] px-3 py-1.5 rounded text-[#f8fafc] hover:bg-[#020617] transition-colors">Localiser</button>
                  <button className="text-xs font-semibold bg-[#ef4444] text-white px-3 py-1.5 rounded hover:bg-[#ef4444]/80 transition-colors">Réassigner fret</button>
                </div>
              </div>
            </div>
          </div>

          {/* Attribution de Route */}
          <div className="group relative bg-[#020617] p-4 rounded-xl border border-[#1e293b] hover:border-[#13ec5b]/30 transition-all cursor-pointer">
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#13ec5b]"></div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b]">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-[#f8fafc]">Nouvelle attribution</h4>
                  <span className="text-xs text-[#94a3b8]">1h</span>
                </div>
                <p className="text-sm text-[#94a3b8]">
                  Le conducteur <span className="font-medium text-[#f8fafc]">J. Doe</span> a été affecté à la Route 9.
                </p>
              </div>
            </div>
          </div>

          {/* Retard Trafic */}
          <div className="group relative bg-[#020617]/50 p-4 rounded-xl border border-[#1e293b] opacity-75 hover:opacity-100 transition-all cursor-pointer">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1]">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-[#f8fafc]">Retard détecté</h4>
                  <span className="text-xs text-[#94a3b8]">3h</span>
                </div>
                <p className="text-sm text-[#94a3b8]">
                  Retard estimé de +45m sur l'A7 Sud dû à des travaux.
                </p>
              </div>
            </div>
          </div>

          {/* Section Hier */}
          <div className="px-2 pt-4 pb-1">
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Hier</h3>
          </div>

          {/* Succès Livraison */}
          <div className="group relative bg-[#020617]/50 p-4 rounded-xl border border-[#1e293b] opacity-75 hover:opacity-100 transition-all cursor-pointer">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-[#f8fafc]">Livraison effectuée</h4>
                  <span className="text-xs text-[#94a3b8]">Hier</span>
                </div>
                <p className="text-sm text-[#94a3b8] mb-2">
                  La commande <span className="text-[#f8fafc]">#8823</span> est arrivée au centre de distribution.
                </p>
                <div className="flex items-center gap-2 mt-2 py-1 px-2 bg-[#020617] rounded w-fit border border-[#1e293b]">
                  <Check className="w-3 h-3 text-[#13ec5b]" />
                  <span className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-tighter">Preuve de livraison jointe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Système */}
          <div className="group relative bg-[#020617]/50 p-4 rounded-xl border border-[#1e293b] opacity-75 hover:opacity-100 transition-all cursor-pointer">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center text-[#94a3b8]">
                  <Server className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-[#f8fafc]">Maintenance Système</h4>
                  <span className="text-xs text-[#94a3b8]">Hier</span>
                </div>
                <p className="text-sm text-[#94a3b8]">
                  Maintenance planifiée terminée. Tous les systèmes sont opérationnels.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Pied de page Actions */}
        <div className="p-4 border-t border-[#1e293b] bg-[#020617]">
          <button className="w-full py-3 px-4 bg-[#0f172a] border border-[#1e293b] text-[#f8fafc] font-semibold rounded-xl hover:bg-[#1e293b] transition-all text-sm flex items-center justify-center gap-2 shadow-lg">
            <Settings className="w-4 h-4" />
            Paramètres de notification
          </button>
        </div>
      </div>
    </div>
  )}
</>


}
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Tableau de bord</h1>
          <p className="text-text-muted mt-1">Bienvenue, voici l'état de votre flotte en temps réel.</p>
        </div>
        <div className='flex space-x-4'>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-border transition-colors text-sm font-medium text-text-main">
            <Calendar className="w-4 h-4" />
            Ce Mois
          </button>
        <Link href="/dashboard/deliveries/new" className="bg-primary hover:bg-primaryHover text-background px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20">
          + Nouvelle Livraison
        </Link>
        <NotificationBell />

        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Livraisons Actives" 
          value="124" 
          change="+12%" 
          trend="up" 
          icon={Activity} 
        />
        <StatCard 
          title="Économie CO2 (kg)" 
          value="850" 
          change="+5.2%" 
          trend="up" 
          icon={Zap} 
        />
        <StatCard 
          title="Flotte Disponible" 
          value="45/50" 
          change="-2" 
          trend="down" 
          icon={Battery} 
        />
         <StatCard 
          title="Revenu du jour" 
          value="1.2M CFA" 
          change="+8%" 
          trend="up" 
          icon={Activity} 
        />
      </div>

      {/* Section : Activité Récente & Carte (Layout 2/3 + 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tableau des courses récentes */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-main mb-6">Livraisons Récentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-text-muted text-sm border-b border-border">
                  <th className="pb-4 font-medium">ID Course</th>
                  <th className="pb-4 font-medium">Chauffeur</th>
                  <th className="pb-4 font-medium">Statut</th>
                  <th className="pb-4 font-medium">Montant</th>
                  <th className="pb-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="group hover:bg-border/50 transition-colors">
                    <td className="py-4 font-mono text-text-muted">#TRK-89{i}</td>
                    <td className="py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-border"></div>
                      <span className="text-text-main font-medium">Amadou K.</span>
                    </td>
                    <td className="py-4">
                      <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold border border-accent/20">
                        En cours
                      </span>
                    </td>
                    <td className="py-4 text-text-main">2,500 CFA</td>
                    <td className="py-4 text-right">
                      <button className="text-primary hover:text-text-main transition-colors">Détails</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mini Map ou Notification Area */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-main mb-4">Aperçu Zone</h2>
          <div className="h-64 bg-border rounded-xl flex items-center justify-center text-text-muted mb-4">
            [Intégration Mapbox Mini]
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-3 bg-border/50 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <p className="text-sm text-text-muted">Zone A: Trafic fluide</p>
             </div>
             <div className="flex items-center gap-3 p-3 bg-border/50 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-danger"></div>
                <p className="text-sm text-text-muted">Zone B: Ralentissements</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}