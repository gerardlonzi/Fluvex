// src/app/dashboard/page.tsx
import { ArrowUpRight, ArrowDownRight, Activity, Battery, Zap , Calendar} from 'lucide-react';

// Composant "Atome" pour les cartes de stats
function StatCard({ title, value, change, trend, icon: Icon }: any) {
  return (
    <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-800 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {change}
        </span>
      </div>
      <h3 className="text-text-muted text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
          <p className="text-text-muted mt-1">Bienvenue, voici l'état de votre flotte en temps réel.</p>
        </div>
        <div className='flex space-x-4'>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-slate-800 transition-colors text-sm font-medium text-white">
            <Calendar className="w-4 h-4" />
            Ce Mois
          </button>
        <button className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/20">
          + Nouvelle Livraison
        </button>
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
          <h2 className="text-lg font-bold text-white mb-6">Livraisons Récentes</h2>
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
                  <tr key={i} className="group hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 font-mono text-slate-400">#TRK-89{i}</td>
                    <td className="py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                      <span className="text-white font-medium">Amadou K.</span>
                    </td>
                    <td className="py-4">
                      <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                        En cours
                      </span>
                    </td>
                    <td className="py-4 text-white">2,500 CFA</td>
                    <td className="py-4 text-right">
                      <button className="text-primary hover:text-white transition-colors">Détails</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mini Map ou Notification Area */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Aperçu Zone</h2>
          <div className="h-64 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 mb-4">
            [Intégration Mapbox Mini]
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <p className="text-sm text-slate-300">Zone A: Trafic fluide</p>
             </div>
             <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-border">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <p className="text-sm text-slate-300">Zone B: Ralentissements</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}