'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source, type MapRef, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Plus, Minus, Crosshair, Truck, X } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type PlaceResult = { id: string; place_name: string; center: [number, number] };

type LiveLocation = {
  driverId: string;
  driverName: string;
  deliveryId: string | null;
  deliveryTrackingId: string | null;
  lat: number;
  lng: number;
  createdAt: string;
};

export default function FleetMap() {
  const mapRef = useRef<MapRef | null>(null);
  const [origin, setOrigin] = useState({ lng: 2.3522, lat: 48.8566 }); // Paris (fallback)

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [destination, setDestination] = useState<{ lng: number; lat: number; label: string } | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [routeMeta, setRouteMeta] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);

  // Charger l'adresse de l'entreprise pour positionner le hub
  useEffect(() => {
    fetch('/api/company', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((company) => {
        if (company?.address && MAPBOX_TOKEN) {
          const fullAddress = `${company.address}${company.city ? `, ${company.city}` : ''}${company.country ? `, ${company.country}` : ''}`;
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${encodeURIComponent(MAPBOX_TOKEN)}&limit=1`
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data?.features?.[0]?.center) {
                const [lng, lat] = data.features[0].center;
                setOrigin({ lng, lat });
                mapRef.current?.flyTo({ center: [lng, lat], zoom: 12 });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${encodeURIComponent(
          MAPBOX_TOKEN
        )}&autocomplete=true&limit=5&language=fr`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          const feats = (json?.features ?? []) as Array<{ id: string; place_name: string; center: [number, number] }>;
          setResults(
            feats.map((f) => ({ id: f.id, place_name: f.place_name, center: f.center }))
          );
        })
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function fetchRoute(dest: { lng: number; lat: number; label: string }) {
    if (!MAPBOX_TOKEN) return;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&overview=full&access_token=${encodeURIComponent(
      MAPBOX_TOKEN
    )}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => null);
    const route = data?.routes?.[0];
    if (!route?.geometry) return;
    setRouteGeoJson({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: route.geometry }],
    });
    setRouteMeta({
      distanceKm: Number(route.distance) / 1000,
      durationMin: Number(route.duration) / 60,
    });
  }

  const routeLayer: Layer = useMemo(
    () => ({
      id: 'route',
      type: 'line',
      paint: {
        'line-color': '#13ec5b',
        'line-width': 4,
        'line-opacity': 0.9,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    }),
    []
  );

  // Polling des positions chauffeurs (toutes les 5 secondes)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/telemetry/locations?minutes=15', {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!Array.isArray(data) || cancelled) return;
        setLiveLocations(data as LiveLocation[]);
      } catch {
        // silencieux
      }
    };

    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Polling des positions chauffeurs (toutes les 5 secondes)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/telemetry/locations?minutes=15', {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!Array.isArray(data) || cancelled) return;
        setLiveLocations(data as LiveLocation[]);
      } catch {
        // silencieux
      }
    };

    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

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
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false} // On retire le logo par défaut pour le style
        ref={mapRef}
      >
        <NavigationControl position="bottom-left" showCompass={false} />

        {/* HQ / Entrepôt (point de référence) */}
        <Marker latitude={origin.lat} longitude={origin.lng}>
          <div className="relative">
            <div className="absolute -inset-1 bg-primary/30 rounded-full animate-ping" />
            <div className="bg-surface border-2 border-primary text-primary p-1.5 rounded-full shadow-xl relative z-10 text-[10px] font-bold">
              HUB
            </div>
          </div>
        </Marker>

        {/* Chauffeurs en temps réel */}
        {liveLocations.map((loc) => (
          <Marker key={loc.driverId} latitude={loc.lat} longitude={loc.lng}>
            <div className="relative">
              <div className="absolute -inset-1 bg-emerald-500/30 rounded-full animate-ping" />
              <div className="bg-surface border-2 border-emerald-500 text-emerald-400 px-2 py-1 rounded-full shadow-xl text-[10px] font-bold">
                {loc.driverName}
              </div>
            </div>
          </Marker>
        ))}

        {/* Destination (search) */}
        {destination && (
          <Marker latitude={destination.lat} longitude={destination.lng}>
            <div className="bg-primary text-background px-3 py-2 rounded-xl shadow-xl border border-primary/30 text-xs font-bold">
              Destination
            </div>
          </Marker>
        )}

        {/* Route line */}
        {routeGeoJson && (
          <Source id="route-src" type="geojson" data={routeGeoJson as any}>
            <Layer {...routeLayer} />
          </Source>
        )}
      </Map>

      {/* 2. Overlay : Barre de Recherche Flottante */}
      <div className="absolute top-6 left-6 z-10 w-80">
        <div className="flex w-full items-center rounded-xl bg-surface/90 backdrop-blur border border-border p-1 shadow-2xl">
          <div className="flex items-center justify-center pl-3 text-text-muted">
            <Search className="w-5 h-5" />
          </div>
          <input 
            className="w-full bg-transparent border-none focus:ring-0 text-sm p-2.5 text-white placeholder:text-slate-500 outline-none" 
            placeholder="Rechercher une adresse, un lieu…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); }}
              className="p-2 text-text-muted hover:text-white"
              aria-label="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {MAPBOX_TOKEN ? (
          results.length > 0 && (
            <div className="mt-2 rounded-xl overflow-hidden border border-border bg-surface/95 backdrop-blur shadow-2xl">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="w-full text-left px-4 py-3 text-xs text-text-main hover:bg-border/40 transition-colors"
                  onClick={async () => {
                    const [lng, lat] = r.center;
                    const dest = { lng, lat, label: r.place_name };
                    setDestination(dest);
                    setResults([]);
                    setQuery(r.place_name);
                    mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, essential: true });
                    await fetchRoute(dest);
                  }}
                >
                  {r.place_name}
                </button>
              ))}
              {searching && <div className="px-4 py-2 text-[10px] text-text-muted">Recherche…</div>}
            </div>
          )
        ) : (
          <div className="mt-2 text-[10px] text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">
            Configure `NEXT_PUBLIC_MAPBOX_TOKEN` pour activer la recherche et l’itinéraire.
          </div>
        )}
      </div>

      {/* Route meta */}
      {routeMeta && (
        <div className="absolute top-24 left-6 z-10">
          <div className="bg-surface/90 backdrop-blur rounded-xl border border-border px-4 py-3 shadow-2xl">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Itinéraire</p>
            <p className="text-sm font-bold text-white">{routeMeta.distanceKm.toFixed(1)} km</p>
            <p className="text-xs text-text-muted">{Math.round(routeMeta.durationMin)} min</p>
          </div>
        </div>
      )}

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
      {/* 4. Overlay : aide / info temps réel */}
      {liveLocations.length === 0 && (
        <div className="absolute top-1/2 left-1/3 z-10 transform -translate-y-1/2 pointer-events-none">
          <div className="bg-surface/90 backdrop-blur rounded-xl shadow-2xl p-3 flex items-center gap-3 border border-primary/40">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
               <span className="text-white font-bold">?</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">En attente de positions chauffeurs…</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wide">
                Ouvrez la page /driver/tracking sur le mobile.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}