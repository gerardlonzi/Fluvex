'use client';

import { useEffect, useState } from 'react';
import { Truck, Zap, ArrowRight } from 'lucide-react';

type Company = { name?: string; address?: string; city?: string; country?: string };
type DeliveryApi = {
  id: string;
  trackingId: string;
  status?: string;
  deliveryAddress?: string | null;
  recipientCompany?: string | null;
  routes?: { origin?: string | null; destination?: string | null; distance?: string | null; distanceKm?: number | null; score?: number | null }[];
};

type RouteItem = {
  id: string;
  type: 'diesel' | 'electric';
  from: string;
  to: string;
  co2: string;
  dist: string;
  badge: string;
  score: string;
};

function scoreToBadge(score: number | null | undefined): string {
  if (score == null) return 'Standard';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Bon';
  if (score >= 50) return 'Standard';
  return 'À améliorer';
}

export function OptimizedRouteList() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [companyRes, deliveriesRes] = await Promise.all([
          fetch('/api/company', { credentials: 'include' }),
          fetch('/api/deliveries', { credentials: 'include' }),
        ]);

        const company: Company = companyRes.ok ? await companyRes.json() : null;
        const raw = deliveriesRes.ok ? await deliveriesRes.json() : null;
        const deliveries: DeliveryApi[] = Array.isArray(raw) ? raw : raw?.deliveries ?? [];

        const fromLabel = company?.name?.trim() || company?.address?.trim() || 'Siège';
        const built: RouteItem[] = [];

        for (const d of deliveries || []) {
          if (d.status === 'CANCELLED' || d.status === 'EXPIRED') continue;
          const toLabel =
            d.deliveryAddress?.trim() ||
            d.recipientCompany?.trim() ||
            `Livraison ${d.trackingId}`;
          const route = d.routes?.[0];
          const score = route?.score ?? null;
          const distKm = route?.distanceKm ?? null;
          const rawDistance = route?.distance ?? null;

          const badge = scoreToBadge(score);
          built.push({
            id: d.trackingId,
            type: 'diesel',
            from: fromLabel,
            to: toLabel,
            co2: score != null ? `Score ${score}` : '—',
            dist:
              distKm != null
                ? `${Number(distKm).toFixed(1)} km`
                : rawDistance && rawDistance.trim().length > 0
                  ? rawDistance
                  : '—',
            badge,
            score: score != null && score >= 80 ? 'bg-primary' : score != null && score >= 50 ? 'bg-emerald-600' : 'bg-amber-500/20',
          });
        }

        // Trier par score décroissant (si disponible), sinon par ordre récent
        built.sort((a, b) => {
          const aScore = deliveries.find((d) => d.trackingId === a.id)?.routes?.[0]?.score ?? 0;
          const bScore = deliveries.find((d) => d.trackingId === b.id)?.routes?.[0]?.score ?? 0;
          return (bScore ?? 0) - (aScore ?? 0);
        });

        if (!cancelled) {
          setRoutes(built.slice(0, 15));
        }
      } catch {
        if (!cancelled) setRoutes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="px-1">
        <h2 className="text-2xl font-bold text-text-main">Top Routes</h2>
        <p className="text-sm text-text-muted">
          Routes basées sur le hub et les lieux de livraison.
        </p>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <p className="text-sm text-text-muted py-4">Chargement des routes…</p>
        ) : routes.length === 0 ? (
          <p className="text-sm text-text-muted py-4">Aucune livraison avec destination. Les top routes apparaîtront ici.</p>
        ) : (
          routes.map((route) => (
            <div
              key={route.id}
              className="p-4 rounded-xl bg-surface border border-border hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-border text-text-muted">
                    {route.type === 'electric' ? <Zap className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                  </div>
                  <span className="font-bold text-text-main text-sm">
                    {route.id}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${route.score} text-primary`}>
                  {route.badge}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-text-muted truncate max-w-[120px]" title={route.from}>
                  {route.from}
                </span>
                <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                <span className="text-xs text-text-muted truncate max-w-[120px]" title={route.to}>
                  {route.to}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-background p-2 rounded-lg">
                  <p className="text-[10px] text-text-muted uppercase font-bold">Éco / Score</p>
                  <p className="text-sm font-bold text-text-main">{route.co2}</p>
                </div>
                <div className="bg-background p-2 rounded-lg">
                  <p className="text-[10px] text-text-muted uppercase font-bold">Distance (km)</p>
                  <p className="text-sm font-bold text-text-main">{route.dist}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
