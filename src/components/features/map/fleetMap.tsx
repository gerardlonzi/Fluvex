'use client';

import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Plus, Minus, Crosshair, Truck } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function FleetMap() {
  return (
    <div className="relative w-full h-full bg-slate-900 group/map">
      
      {/* 1. La Carte Mapbox (Fond) */}
      <Map
        initialViewState={{
          latitude: 48.8566,
          longitude: 2.3522,
          zoom: 12
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false} // On retire le logo par défaut pour le style
      >
        {/* Exemple de marqueur véhicule */}
        <Marker latitude={48.8566} longitude={2.3522}>
           <div className="relative">
             <div className="absolute -inset-1 bg-primary/30 rounded-full animate-ping"></div>
             <div className="bg-surface border-2 border-primary text-primary p-2 rounded-full shadow-xl relative z-10">
               <Truck className="w-5 h-5" />
             </div>
           </div>
        </Marker>
      </Map>

      {/* 2. Overlay : Barre de Recherche Flottante */}
      <div className="absolute top-6 left-6 z-10 w-80">
        <div className="flex w-full items-center rounded-xl bg-surface/90 backdrop-blur border border-border p-1 shadow-2xl">
          <div className="flex items-center justify-center pl-3 text-text-muted">
            <Search className="w-5 h-5" />
          </div>
          <input 
            className="w-full bg-transparent border-none focus:ring-0 text-sm p-2.5 text-white placeholder:text-slate-500 outline-none" 
            placeholder="Rechercher un ID, une zone..."
          />
        </div>
      </div>

      {/* 3. Overlay : Contrôles Map Custom */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2">
        <div className="flex flex-col bg-surface/90 backdrop-blur rounded-lg shadow-xl border border-border overflow-hidden">
          <button className="p-3 hover:bg-slate-800 border-b border-border text-white transition-colors">
            <Plus className="w-5 h-5" />
          </button>
          <button className="p-3 hover:bg-slate-800 text-white transition-colors">
            <Minus className="w-5 h-5" />
          </button>
        </div>
        <button className="p-3 bg-surface/90 backdrop-blur rounded-lg shadow-xl border border-border hover:bg-slate-800 text-primary transition-colors">
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* 4. Overlay : Toast "Driver Nearby" (Animation) */}
      <div className="absolute top-1/2 left-1/3 z-10 transform -translate-y-1/2 pointer-events-none">
        <div className="bg-surface/90 backdrop-blur rounded-xl shadow-2xl p-3 flex items-center gap-3 border border-primary/40 animate-bounce">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
             <span className="text-white font-bold">MR</span>
          </div>
          <div>
            <p className="text-xs font-bold text-white">Mike R.</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wide">En avance</p>
          </div>
        </div>
      </div>

    </div>
  );
}