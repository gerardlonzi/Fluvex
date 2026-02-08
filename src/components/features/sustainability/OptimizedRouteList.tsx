import { Truck, Zap, ArrowRight } from 'lucide-react';

const topRoutes = [
  { id: 'A-12', type: 'diesel', from: 'Paris Nord', to: 'Lille Hub', co2: '124 kg', dist: '215 km', badge: 'Excellent', score: 'bg-primary' },
  { id: 'B-09', type: 'diesel', from: 'Lyon Centre', to: 'Marseille', co2: '98 kg', dist: '280 km', badge: 'Bon', score: 'bg-emerald-600' },
  { id: 'E-22', type: 'electric', from: 'Bordeaux', to: 'Nantes', co2: '100%', dist: 'Utilisé 65%', badge: 'Zéro Émission', score: 'bg-primary' },
];

export function OptimizedRouteList() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="px-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Top Routes</h2>
        <p className="text-sm text-text-muted">Plus grosses économies de CO2 cette semaine.</p>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
        {topRoutes.map((route, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all cursor-pointer group">
            
            {/* Header Card */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-text-muted">
                  {route.type === 'electric' ? <Zap className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Route {route.id}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary`}>
                {route.badge}
              </span>
            </div>

            {/* Path */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-text-muted">{route.from}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="text-xs text-text-muted">{route.to}</span>
            </div>

            {/* Stats Mini Grid */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-background p-2 rounded-lg">
                <p className="text-[10px] text-text-muted uppercase font-bold">Éco CO2</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{route.co2}</p>
              </div>
              <div className="bg-background p-2 rounded-lg">
                <p className="text-[10px] text-text-muted uppercase font-bold">
                    {route.type === 'electric' ? 'Batterie' : 'Distance'}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{route.dist}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}