'use client';

import { useState } from 'react';
import { 
  MoreVertical, RefreshCw, Clock, Fuel, Truck, 
  MapPin, AlertTriangle, CheckCircle, Loader2, Download 
} from 'lucide-react';
import { clsx } from 'clsx';
import { downloadExport } from '@/utils/downloadExport';

// Type pour nos données (Mock)
interface Route {
  id: string;
  status: 'TRANSIT' | 'DELAYED' | 'LOADING' | 'COMPLETED';
  driver: string;
  eta: string;
  alert?: string;
  progress?: number;
}

const routes: Route[] = [
  { id: 'SF-892', status: 'TRANSIT', driver: 'Michael T.', eta: 'On Time' },
  { id: 'NY-201', status: 'DELAYED', driver: 'Sarah Connor', eta: '11:52 AM', alert: 'Embouteillage I-80 E' },
  { id: 'LA-554', status: 'LOADING', driver: 'John Doe', eta: 'Loading...', progress: 45 },
  { id: 'TX-102', status: 'COMPLETED', driver: 'Mike R.', eta: '9:15 AM' },
];

export function RoutePanel() {
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    await downloadExport('/api/export/routes?format=csv', 'routes_actives.csv');
    setExporting(false);
  };
  return (
    <aside className="w-96 bg-surface border-l border-border flex flex-col h-full shadow-2xl z-20">
      {/* Header Section */}
      <div className="p-6 border-b border-border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-main">Détails des Routes</h1>
            <p className="text-xs text-text-muted mt-1">Division France • 42 Actifs</p>
          </div>
          <button className="text-text-muted hover:text-text-main transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        {/* Optimization Action */}
        <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-background font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 group">
          <RefreshCw className="w-5 h-5 group-hover:animate-spin" />
          Optimiser les trajets
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 p-6 pt-4 pb-2">
        <div className="bg-border/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Retard Est.</span>
          </div>
          <p className="text-lg font-bold text-text-main">-12<span className="text-xs font-normal ml-0.5 text-primary">min</span></p>
        </div>
        <div className="bg-border/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Fuel className="w-4 h-4" />
            <span className="text-xs font-medium">Carburant Éco</span>
          </div>
          <p className="text-lg font-bold text-text-main">8.4<span className="text-xs font-normal ml-0.5 text-primary">%</span></p>
        </div>
      </div>

      {/* Scrollable Route List */}
      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 custom-scrollbar">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Routes Actives</p>
        
        {routes.map((route) => (
          <div 
            key={route.id}
            className={clsx(
              "bg-surface border rounded-xl p-4 transition-all cursor-pointer hover:shadow-md relative overflow-hidden group",
              route.status === 'TRANSIT' ? "border-primary/50 shadow-[0_4px_12px_rgba(16,185,129,0.1)]" : "border-border hover:border-primary/30"
            )}
          >
            {route.status === 'TRANSIT' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
            
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-border rounded-md p-1">
                  <Truck className="w-4 h-4 text-text-main" />
                </div>
                <span className="text-sm font-bold text-text-main">#{route.id}</span>
              </div>
              <Badge status={route.status} />
            </div>

            {/* Content based on status */}
            {route.status === 'DELAYED' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                <AlertTriangle className="w-4 h-4" />
                <span>{route.alert}</span>
              </div>
            )}

            {route.status === 'LOADING' && (
               <div className="mt-2">
                <div className="w-full bg-border rounded-full h-1.5">
                  <div className="bg-accent h-1.5 rounded-full" style={{ width: `${route.progress}%` }}></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-text-muted">Chargement</span>
                  <span className="text-[10px] font-bold text-accent">{route.progress}%</span>
                </div>
              </div>
            )}

            {route.status === 'TRANSIT' && (
               <div className="flex flex-col gap-2 mt-3 pl-2 border-l border-border ml-2">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs text-text-muted">Entrepôt A</span>
                    <span className="text-[10px] text-text-muted">10:00</span>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs text-white font-medium">Tech District</span>
                    <span className="text-[10px] text-primary font-bold">10:45</span>
                  </div>
               </div>
            )}

            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-[10px] text-text-main">
                    {route.driver.charAt(0)}
                </div>
                <span className="text-xs text-text-muted">{route.driver}</span>
              </div>
              <span className={clsx("text-xs font-bold", route.status === 'DELAYED' ? 'text-danger' : 'text-primary')}>
                {route.eta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-border bg-border">
        <button type="button" onClick={handleExport} disabled={exporting} className="w-full flex items-center justify-center gap-2 border border-border bg-surface hover:bg-slate-800 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Export...' : 'Exporter les données'}
        </button>
      </div>
    </aside>
  );
}

// Petit composant helper pour les badges
function Badge({ status }: { status: string }) {
  const styles = {
    TRANSIT: "bg-primary/20 text-primary border-primary/20",
    DELAYED: "bg-red-500/20 text-red-400 border-red-500/20",
    LOADING: "bg-accent/20 text-accent border-accent/20",
    COMPLETED: "bg-border text-text-muted border-border",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${styles[status as keyof typeof styles]}`}>
      {status}
    </span>
  );
}
