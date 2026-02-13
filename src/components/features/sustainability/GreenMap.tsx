'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Map, { Layer, Marker, Source, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Maximize2 } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type RouteShape = { origin: string | null; destination: string | null; score: number | null };
type CorridorGeo = { coordinates: [number, number][]; efficiency: 'high' | 'medium' | 'low' };

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-1 ${color} rounded-full`} />
      <span className="text-xs font-medium text-slate-900 dark:text-white">{label}</span>
    </div>
  );
}

export function GreenMap() {
  const [center, setCenter] = useState<{ lng: number; lat: number } | null>(null);
  const [corridors, setCorridors] = useState<CorridorGeo[]>([]);
  const [loading, setLoading] = useState(true);
  const zoom = 11;

  const geocode = useCallback(async (address: string): Promise<[number, number] | null> => {
    if (!MAPBOX_TOKEN || !address?.trim()) return null;
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${encodeURIComponent(MAPBOX_TOKEN)}&limit=1`
    );
    const data = await res.json().catch(() => null);
    const coords = data?.features?.[0]?.center;
    return coords ? [coords[0], coords[1]] : null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!MAPBOX_TOKEN) {
        setLoading(false);
        return;
      }
      try {
        const [companyRes, deliveriesRes] = await Promise.all([
          fetch('/api/company', { credentials: 'include' }),
          fetch('/api/deliveries', { credentials: 'include' }),
        ]);

        const company = companyRes.ok ? await companyRes.json() : null;
        const deliveries = deliveriesRes.ok ? await deliveriesRes.json() : [];

        const fullAddress = company?.address
          ? `${company.address}${company.city ? `, ${company.city}` : ''}${company.country ? `, ${company.country}` : ''}`.trim()
          : '';
        const hub = fullAddress ? await geocode(fullAddress) : null;

        if (hub && !cancelled) {
          setCenter({ lng: hub[0], lat: hub[1] });
        } else if (!cancelled) {
          setCenter({ lng: 2.3522, lat: 48.8566 });
        }

        const routes: RouteShape[] = [];
        for (const d of deliveries || []) {
          for (const r of d.routes || []) {
            if (r.origin || r.destination) {
              routes.push({
                origin: r.origin ?? null,
                destination: r.destination ?? null,
                score: r.score ?? null,
              });
            }
          }
        }

        const corridorsData: CorridorGeo[] = [];
        const hubCoords = hub ?? [2.3522, 48.8566];

        for (const route of routes.slice(0, 5)) {
          const from = route.origin ? await geocode(route.origin) : hubCoords;
          const to = route.destination ? await geocode(route.destination) : null;
          if (from && to && from[0] !== to[0] && from[1] !== to[1]) {
            const efficiency: 'high' | 'medium' | 'low' =
              route.score != null
                ? route.score >= 80
                  ? 'high'
                  : route.score >= 50
                    ? 'medium'
                    : 'low'
                : 'medium';
            corridorsData.push({
              coordinates: [from, to],
              efficiency,
            });
          }
        }

        if (corridorsData.length === 0 && hub && !cancelled) {
          const fallbackDest = [hub[0] + 0.05, hub[1] + 0.02] as [number, number];
          corridorsData.push({
            coordinates: [hub, fallbackDest],
            efficiency: 'high',
          });
        }

        if (!cancelled) setCorridors(corridorsData);
      } catch {
        if (!cancelled) setCenter({ lng: 2.3522, lat: 48.8566 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [geocode]);

  const corridorFeatures = useMemo(() => {
    return corridors.map((c, i) => ({
      type: 'Feature' as const,
      properties: { efficiency: c.efficiency },
      geometry: {
        type: 'LineString' as const,
        coordinates: c.coordinates,
      },
    }));
  }, [corridors]);

  const geoJson = useMemo(
    () =>
      corridorFeatures.length
        ? { type: 'FeatureCollection' as const, features: corridorFeatures }
        : null,
    [corridorFeatures]
  );

  const lineLayer: Layer = useMemo(
    () => ({
      id: 'corridors',
      type: 'line',
      paint: {
        'line-color': [
          'match',
          ['get', 'efficiency'],
          'high',
          '#22c55e',
          'medium',
          '#f59e0b',
          '#ef4444',
        ],
        'line-width': 4,
        'line-opacity': 0.9,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    }),
    []
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Carte des Corridors Verts</h2>
        </div>
        <div className="flex-1 min-h-[400px] rounded-2xl border border-border bg-surface flex items-center justify-center text-text-muted">
          Configurez NEXT_PUBLIC_MAPBOX_TOKEN pour afficher la carte.
        </div>
      </div>
    );
  }

  const viewState = center
    ? { longitude: center.lng, latitude: center.lat, zoom }
    : { longitude: 2.3522, latitude: 48.8566, zoom: 11 };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Carte des Corridors Verts</h2>
          <p className="text-sm text-text-muted">Itinéraires optimisés pour l&apos;efficacité énergétique.</p>
        </div>
        <button
          type="button"
          className="p-2 rounded-lg bg-surface border border-border hover:text-primary text-text-muted shadow-sm transition-colors"
          aria-label="Agrandir"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      <div className="relative w-full flex-1 min-h-[400px] rounded-2xl overflow-hidden border border-border shadow-sm group">
        {loading ? (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-text-muted">
            Chargement de la carte…
          </div>
        ) : (
          <Map
            key={center ? `${center.lng}-${center.lat}` : 'default'}
            initialViewState={viewState}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            attributionControl={false}
          >
            <NavigationControl position="bottom-left" showCompass={false} />
            {center && (
              <Marker latitude={center.lat} longitude={center.lng}>
                <div className="bg-surface border-2 border-primary text-primary px-2 py-1 rounded-full shadow-lg text-[10px] font-bold">
                  HUB
                </div>
              </Marker>
            )}
            {geoJson && (
              <Source id="corridors" type="geojson" data={geoJson}>
                <Layer {...lineLayer} />
              </Source>
            )}
          </Map>
        )}

        <div className="absolute top-4 left-4">
          <div className="bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-border flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
              Optimisation Live
            </span>
          </div>
        </div>

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
