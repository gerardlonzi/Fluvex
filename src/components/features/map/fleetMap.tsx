'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source, type MapRef, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Plus, Minus, Crosshair, X, Locate, Loader2 } from 'lucide-react';

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
  
  // Cette partie charge automatiquement l'adresse enregistrée lors de l'inscription
  const [origin, setOrigin] = useState<{ lng: number; lat: number } | null>(null);
  
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [destination, setDestination] = useState<{ lng: number; lat: number; label: string } | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [routeMeta, setRouteMeta] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);

  // 1. Charger l'adresse de l'entreprise (HUB) depuis la DB
  useEffect(() => {
    const fetchCompanyAndGeocode = async () => {
      try {
        const res = await fetch('/api/company', { credentials: 'include' });
        if (!res.ok) return;
        const company = await res.json();

        // Si l'utilisateur a utilisé le GPS ou tapé une adresse lors de l'inscription, elle est ici dans company.address
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
            // On centre immédiatement sur l'adresse de l'entreprise
            mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 2000 });
          }
        }
      } catch (error) {
        console.error("Erreur HUB:", error);
      }
    };
    fetchCompanyAndGeocode();
  }, []);

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
        setRouteGeoJson({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: {}, geometry: route.geometry }],
        });
        setRouteMeta({
          distanceKm: route.distance / 1000,
          durationMin: route.duration / 60,
        });
      }
    } catch (err) {
      console.error("Erreur itinéraire:", err);
    }
  }

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

  const routeLayer: Layer = useMemo(() => ({
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
        if (Array.isArray(data) && !cancelled) setLiveLocations(data);
      } catch (err) { /* silencieux */ }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900 group/map">
      <Map
        initialViewState={{ latitude: 48.8566, longitude: 2.3522, zoom: 12 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        ref={mapRef}
      >
        <NavigationControl position="bottom-left" showCompass={false} />

        {/* HUB : C'est ici que s'affichera l'adresse enregistrée à l'inscription */}
        {origin && (
          <Marker latitude={origin.lat} longitude={origin.lng}>
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/30 rounded-full animate-ping" />
              <div className="bg-slate-900 border-2 border-[#13ec5b] text-[#13ec5b] p-1.5 rounded-full shadow-xl relative z-10 text-[10px] font-bold">
                HUB
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
      <div className="absolute top-6 left-6 z-10 w-80">
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

      {/* Boutons Zoom & GPS Destination */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2">
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