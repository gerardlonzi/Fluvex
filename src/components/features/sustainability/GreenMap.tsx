import { Maximize2, Plus, Minus, Zap } from 'lucide-react';

export function GreenMap() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Carte des Corridors Verts</h2>
          <p className="text-sm text-text-muted">Itinéraires optimisés pour l'efficacité énergétique.</p>
        </div>
        <button className="p-2 rounded-lg bg-surface border border-border hover:text-primary text-text-muted shadow-sm transition-colors">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      <div className="relative w-full flex-1 min-h-[400px] rounded-2xl overflow-hidden border border-border shadow-sm group">
        
        {/* Placeholder Map (Tu peux remettre Mapbox ici si tu veux) */}
        <div className="absolute inset-0 bg-slate-800 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/2.3522,48.8566,10,0/800x600?access_token=Pk...')] bg-cover bg-center grayscale-[20%] opacity-80 transition-transform duration-700 group-hover:scale-105"></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none"></div>

        {/* UI Overlay: Live Tag */}
        <div className="absolute top-4 left-4">
          <div className="bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-border flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">Optimisation Live</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-surface/90 backdrop-blur-sm rounded-lg shadow-lg border border-border overflow-hidden">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition-colors">
            <Plus className="w-5 h-5" />
          </button>
          <div className="h-[1px] w-full bg-border"></div>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted transition-colors">
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Legend Card */}
        <div className="absolute bottom-4 left-4 bg-surface/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-border min-w-[180px]">
          <h4 className="text-[10px] font-bold uppercase text-text-muted mb-3 tracking-wider">Efficacité Trajet</h4>
          <div className="space-y-2">
            <LegendItem color="bg-primary" label="Haute (Eco)" />
            <LegendItem color="bg-amber-500" label="Standard" />
            <LegendItem color="bg-red-500" label="Congestion" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-1 ${color} rounded-full`}></div>
      <span className="text-xs font-medium text-slate-900 dark:text-white">{label}</span>
    </div>
  );
}