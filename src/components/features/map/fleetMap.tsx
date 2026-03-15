'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source, type MapRef, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Plus, Minus, Crosshair, X, Locate, Maximize2, Minimize2 } from 'lucide-react';

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

export type FleetMapProps = {
  selectedDeliveryAddress?: string | null;
  onRouteMeta?: (meta: { distanceKm: number; durationMin: number } | null) => void;
  fullscreen?: boolean;
  onFullscreenChange?: (full: boolean) => void;
};

export default function FleetMap({ selectedDeliveryAddress = null, onRouteMeta, fullscreen = false, onFullscreenChange }: FleetMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  
  const [origin, setOrigin] = useState<{ lng: number; lat: number } | null>(null);
  
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [destination, setDestination] = useState<{ lng: number; lat: number; label: string } | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [routeMeta, setRouteMeta] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);

  // Position par défaut du HUB (Paris) si aucune adresse entreprise
  const DEFAULT_HUB = { lng: 2.3522, lat: 48.8566 };

  // 1. Charger l'adresse de l'entreprise (HUB) depuis la DB et afficher la position sur la carte
  useEffect(() => {
    const fetchCompanyAndGeocode = async () => {
      try {
        const res = await fetch('/api/company', { credentials: 'include' });
        if (!res.ok) {
          setOrigin(DEFAULT_HUB);
          return;
        }
        const company = await res.json();

        if (company?.address && MAPBOX_TOKEN) {
          const fullAddress = [company.address, company.city, company.country]
            .filter(Boolean)
            .join(', ');

          const geoRes = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
          );
          const data = await geoRes.json();

          if (data?.features?.[0]?.center) {
            const [lng, lat] = data.features[0].center;
            setOrigin({ lng, lat });
          } else {
            setOrigin(DEFAULT_HUB);
          }
        } else {
          setOrigin(DEFAULT_HUB);
        }
      } catch (error) {
        console.error("Erreur HUB:", error);
        setOrigin(DEFAULT_HUB);
      }
    };
    fetchCompanyAndGeocode();
  }, []);

  // Centrer la carte sur le HUB dès que la position est connue (map peut être déjà montée)
  useEffect(() => {
    if (!origin) return;
    const t = setTimeout(() => {
      mapRef.current?.flyTo({ center: [origin.lng, origin.lat], zoom: 12, duration: 1500 });
    }, 300);
    return () => clearTimeout(t);
  }, [origin]);

  // 2. Recherche d'adresse (Autocomplete pour la destination)
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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=fr`
      )
        .then((r) => r.json())
        .then((json) => {
          const feats = (json?.features ?? []) as PlaceResult[];
          setResults(feats.map((f) => ({ id: f.id, place_name: f.place_name, center: f.center })));
        })
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Fermer la liste de suggestions quand on clique en dehors
  useEffect(() => {
    if (!results.length) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [results.length]);

  // 3. Calcul de l'itinéraire
  async function fetchRoute(dest: { lng: number; lat: number; label: string }) {
    if (!MAPBOX_TOKEN || !origin) {
        if(!origin) alert("L'adresse de départ (Hub) n'est pas encore chargée.");
        return;
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      const route = data?.routes?.[0];

      if (route?.geometry) {
        const meta = { distanceKm: route.distance / 1000, durationMin: route.duration / 60 };
        setRouteGeoJson({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: route.geometry }],
        });
        setRouteMeta(meta);
        onRouteMeta?.(meta);
      }
    } catch (err) {
      console.error("Erreur itinéraire:", err);
      onRouteMeta?.(null);
    }
  }

  // Quand une livraison est sélectionnée dans le panel, afficher son itinéraire sur la carte
  useEffect(() => {
    if (!MAPBOX_TOKEN || !selectedDeliveryAddress?.trim() || !origin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(selectedDeliveryAddress)}.json?access_token=${MAPBOX_TOKEN}&limit=1&language=fr`
        );
        const data = await res.json();
        const center = data?.features?.[0]?.center as [number, number] | undefined;
        if (cancelled || !center) return;
        const [lng, lat] = center;
        const dest = { lng, lat, label: selectedDeliveryAddress };
        setDestination(dest);
        setQuery(selectedDeliveryAddress);
        setResults([]);
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, duration: 1000 });
        await fetchRoute(dest);
      } catch {
        if (!cancelled) onRouteMeta?.(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDeliveryAddress, origin]);

  // Fonction GPS (Côté Dashboard pour définir une DESTINATION via GPS si besoin)
  const handleGeolocateDestination = () => {
    if (!navigator.geolocation) return;
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 14 });

        if (MAPBOX_TOKEN) {
          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1`
            );
            const data = await res.json();
            const placeName = data?.features?.[0]?.place_name || "Position GPS";
            const dest = { lng: longitude, lat: latitude, label: placeName };
            
            setDestination(dest);
            setQuery(placeName);
            setResults([]);
            await fetchRoute(dest);

          } catch (error) { console.error(error); } 
          finally { setSearching(false); }
        }
      },
      (err) => { setSearching(false); console.error(err); },
      { enableHighAccuracy: true }
    );
  };

  const routeLayer = useMemo((): React.ComponentProps<typeof Layer> => ({
      id: 'route', type: 'line',
      paint: { 'line-color': '#13ec5b', 'line-width': 4, 'line-opacity': 0.9 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    }), []);

  // Polling positions
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/telemetry/locations?minutes=15', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setLiveLocations(Array.isArray(data) ? data : []);
          setLocationsLoaded(true);
        }
      } catch (err) { if (!cancelled) setLocationsLoaded(true); }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className={`relative w-full h-full bg-slate-900 group/map ${fullscreen ? 'fixed inset-0 z-[100]' : ''}`}>
      <Map
        initialViewState={{ latitude: 48.8566, longitude: 2.3522, zoom: 12 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        ref={mapRef}
      >
        <NavigationControl position="bottom-left" showCompass={false} />

        {/* HUB : position toujours affichée sur la carte (adresse entreprise ou défaut) */}
        {origin && (
          <Marker latitude={origin.lat} longitude={origin.lng} anchor="bottom">
            <div className="relative flex flex-col items-center">
              <div className="absolute -inset-1 bg-primary/30 rounded-full animate-ping" />
              <div className="bg-slate-900 border-2 border-[#13ec5b] text-[#13ec5b] px-2 py-1.5 rounded-lg shadow-xl relative z-10 text-[10px] font-bold whitespace-nowrap">
                HUB
              </div>
              <div className="mt-1 px-2 py-0.5 rounded bg-slate-900/95 border border-slate-700 text-[9px] text-slate-300 max-w-[140px] truncate" title={origin.lng === DEFAULT_HUB.lng && origin.lat === DEFAULT_HUB.lat ? "Configurer l'adresse dans Paramètres" : undefined}>
                {origin.lng === DEFAULT_HUB.lng && origin.lat === DEFAULT_HUB.lat ? "Adresse à configurer" : "Siège"}
              </div>
            </div>
          </Marker>
        )}

        {liveLocations.map((loc) => (
          <Marker key={loc.driverId} latitude={loc.lat} longitude={loc.lng}>
             <div className="relative">
              <div className="absolute -inset-1 bg-emerald-500/30 rounded-full animate-ping" />
              <div className="bg-slate-900 border-2 border-emerald-500 text-emerald-400 px-2 py-1 rounded-full shadow-xl text-[10px] font-bold">{loc.driverName}</div>
            </div>
          </Marker>
        ))}

        {destination && (
          <Marker latitude={destination.lat} longitude={destination.lng}>
            <div className="bg-[#13ec5b] text-slate-950 px-3 py-2 rounded-xl shadow-xl font-bold text-xs">Destination</div>
          </Marker>
        )}

        {routeGeoJson && (
          <Source id="route-src" type="geojson" data={routeGeoJson}>
            <Layer {...routeLayer} />
          </Source>
        )}
      </Map>

      {/* Interface de recherche Destination */}
      <div className="absolute top-6 left-6 z-10 w-80" ref={searchBoxRef}>
        <div className="flex w-full items-center rounded-xl bg-slate-900/90 backdrop-blur border border-slate-800 p-1 shadow-2xl">
          <div className="pl-3 text-slate-400"><Search className="w-5 h-5" /></div>
          <input className="w-full bg-transparent border-none focus:ring-0 text-sm p-2.5 text-white outline-none" placeholder="Rechercher une destination..." value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button onClick={() => { setQuery(''); setResults([]); }} className="p-2 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>

        {results.length > 0 && (
          <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/95 backdrop-blur shadow-2xl">
            {results.map((r) => (
              <button key={r.id} className="w-full text-left px-4 py-3 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
                onClick={async () => {
                  const [lng, lat] = r.center;
                  const dest = { lng, lat, label: r.place_name };
                  setDestination(dest);
                  setResults([]);
                  setQuery(r.place_name);
                  mapRef.current?.flyTo({ center: [lng, lat], zoom: 13 });
                  await fetchRoute(dest);
                }}
              >{r.place_name}</button>
            ))}
          </div>
        )}
      </div>

      {/* Message aucun chauffeur connecté */}
      {locationsLoaded && liveLocations.length === 0 && (
        <div className="absolute top-6 right-6 z-10">
          <div className="rounded-xl bg-slate-900/95 backdrop-blur border border-amber-500/30 px-4 py-3 shadow-xl max-w-[260px]">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Aucun chauffeur connecté
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Les positions des chauffeurs s&apos;afficheront ici dès qu&apos;ils seront en ligne.
            </p>
          </div>
        </div>
      )}

      {/* Infos Itinéraire */}
      {routeMeta && (
        <div className="absolute top-24 left-6 z-10">
          <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-800 px-4 py-3 shadow-2xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Itinéraire</p>
            <p className="text-sm font-bold text-white">{routeMeta.distanceKm.toFixed(1)} km</p>
            <p className="text-xs text-slate-400">{Math.round(routeMeta.durationMin)} min</p>
          </div>
        </div>
      )}

      {/* Boutons Zoom, GPS, Plein écran */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2">
        {onFullscreenChange && (
          <button
            onClick={() => onFullscreenChange(!fullscreen)}
            className="p-3 bg-slate-900/90 backdrop-blur rounded-lg shadow-xl border border-slate-800 hover:bg-slate-800 text-white transition-colors"
            aria-label={fullscreen ? 'Réduire' : 'Plein écran'}
          >
            {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        )}
        <div className="flex flex-col bg-slate-900/90 backdrop-blur rounded-lg shadow-xl border border-slate-800 overflow-hidden">
          <button onClick={() => mapRef.current?.zoomIn()} className="p-3 hover:bg-slate-800 text-white border-b border-slate-800"><Plus className="w-5 h-5" /></button>
          <button onClick={() => mapRef.current?.zoomOut()} className="p-3 hover:bg-slate-800 text-white"><Minus className="w-5 h-5" /></button>
        </div>
        <button onClick={handleGeolocateDestination} className="p-3 bg-slate-900/90 backdrop-blur rounded-lg shadow-xl border border-slate-800 hover:bg-slate-800 text-blue-400 transition-colors">
          <Locate className={`w-5 h-5 ${searching ? 'animate-pulse' : ''}`} />
        </button>
        <button onClick={() => origin && mapRef.current?.flyTo({ center: [origin.lng, origin.lat], zoom: 12 })} className="p-3 bg-slate-900/90 backdrop-blur rounded-lg shadow-xl border border-slate-800 text-[#13ec5b]">
          <Crosshair className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}