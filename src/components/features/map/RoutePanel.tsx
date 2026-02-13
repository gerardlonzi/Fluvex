'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  MoreVertical, RefreshCw, Clock, Fuel, Truck, 
  MapPin, AlertTriangle, CheckCircle, Loader2, Download 
} from 'lucide-react';
import { clsx } from 'clsx';
import { downloadExport } from '@/utils/downloadExport';

type DeliveryApi = {
  id: string;
  trackingId: string;
  status: string;
  createdAt: string;
  driver: { name: string } | null;
  deliveryAddress?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  TRANSIT: 'En transit',
  DELAYED: 'Retardé',
  LOADING: 'Chargement',
  COMPLETED: 'Terminée',
  PENDING: 'En attente',
  CANCELLED: 'Annulée',
};

export function RoutePanel() {
  const [exporting, setExporting] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/deliveries', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDeliveries(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const activeDeliveries = useMemo(() => 
    deliveries.filter((d) => ['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'].includes(d.status)),
    [deliveries]
  );

  const { delayMinutes, fuelEcoPct } = useMemo(() => {
    const delayed = deliveries.filter((d) => d.status === 'DELAYED').length;
    const completed = deliveries.filter((d) => d.status === 'COMPLETED').length;
    const total = deliveries.length || 1;
    const delayMinutes = delayed > 0 ? -Math.round((completed / total) * 15) : 0;
    const fuelEcoPct = total > 0 ? Math.round(70 + (completed / total) * 25) : 0;
    return { delayMinutes, fuelEcoPct };
  }, [deliveries]);

  const handleExport = async () => {
    setExporting(true);
    await downloadExport('/api/export/routes?format=csv', 'routes_actives.csv');
    setExporting(false);
  };

  return (
    <aside className="w-96 bg-surface border-l border-border flex flex-col h-full shadow-2xl z-20">
      <div className="p-6 border-b border-border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-main">Détails des Routes</h1>
            <p className="text-xs text-text-muted mt-1">{activeDeliveries.length} actif(s)</p>
          </div>
          <button type="button" className="text-text-muted hover:text-text-main transition-colors" aria-label="Options">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        <button type="button" className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-background font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 group">
          <RefreshCw className="w-5 h-5 group-hover:animate-spin" />
          Optimiser les trajets
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-6 pt-4 pb-2">
        <div className="bg-border/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Retard Est.</span>
          </div>
          <p className="text-lg font-bold text-text-main">
            {loading ? '…' : delayMinutes <= 0 ? `${delayMinutes}` : `+${delayMinutes}`}
            <span className="text-xs font-normal ml-0.5 text-primary">min</span>
          </p>
        </div>
        <div className="bg-border/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Fuel className="w-4 h-4" />
            <span className="text-xs font-medium">Carburant Éco</span>
          </div>
          <p className="text-lg font-bold text-text-main">
            {loading ? '…' : fuelEcoPct}
            <span className="text-xs font-normal ml-0.5 text-primary">%</span>
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 custom-scrollbar">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Routes actives</p>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeDeliveries.length === 0 ? (
          <p className="text-sm text-text-muted py-4">Aucune route active.</p>
        ) : (
          activeDeliveries.slice(0, 20).map((d) => (
            <RouteCard key={d.id} delivery={d} />
          ))
        )}
      </div>

      <div className="p-4 border-t border-border bg-border/30">
        <button type="button" onClick={handleExport} disabled={exporting} className="w-full flex items-center justify-center gap-2 border border-border bg-surface hover:bg-border text-text-main text-sm font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Export…' : 'Exporter les données'}
        </button>
      </div>
    </aside>
  );
}

function RouteCard({ delivery }: { delivery: DeliveryApi }) {
  const status = delivery.status as keyof typeof STATUS_LABELS;
  const label = STATUS_LABELS[status] ?? status;
  const isTransit = delivery.status === 'TRANSIT';
  const isDelayed = delivery.status === 'DELAYED';
  const isLoading = delivery.status === 'LOADING';
  const driverName = delivery.driver?.name ?? 'Non assigné';
  const createdAt = new Date(delivery.createdAt);
  const eta = isDelayed ? 'Retardé' : isTransit ? 'À l\'heure' : isLoading ? 'Chargement…' : createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={clsx(
        'bg-surface border rounded-xl p-4 transition-all cursor-pointer hover:shadow-md relative overflow-hidden',
        isTransit ? 'border-primary/50 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' : 'border-border hover:border-primary/30'
      )}
    >
      {isTransit && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-border rounded-md p-1">
            <Truck className="w-4 h-4 text-text-main" />
          </div>
          <span className="text-sm font-bold text-text-main">#{delivery.trackingId}</span>
        </div>
        <Badge status={label} />
      </div>
      {isDelayed && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
          <AlertTriangle className="w-4 h-4" />
          <span>Trafic ou incident</span>
        </div>
      )}
      {isLoading && (
        <div className="mt-2">
          <div className="w-full bg-border rounded-full h-1.5">
            <div className="bg-accent h-1.5 rounded-full" style={{ width: '50%' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-text-muted">Chargement</span>
            <span className="text-[10px] font-bold text-accent">50%</span>
          </div>
        </div>
      )}
      {isTransit && delivery.deliveryAddress && (
        <div className="flex flex-col gap-2 mt-3 pl-2 border-l border-border ml-2">
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-text-muted truncate">Hub</span>
            <span className="text-[10px] text-text-muted">{createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-text-main font-medium truncate">{delivery.deliveryAddress}</span>
            <span className="text-[10px] text-primary font-bold">ETA</span>
          </div>
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-[10px] text-text-main font-bold">
            {driverName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-text-muted truncate max-w-[120px]">{driverName}</span>
        </div>
        <span className={clsx('text-xs font-bold', isDelayed ? 'text-danger' : 'text-primary')}>
          {eta}
        </span>
      </div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'En transit': 'bg-primary/20 text-primary border-primary/20',
    'Retardé': 'bg-red-500/20 text-red-400 border-red-500/20',
    'Chargement': 'bg-accent/20 text-accent border-accent/20',
    'Terminée': 'bg-border text-text-muted border-border',
    'En attente': 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={clsx('text-[10px] font-bold px-2 py-1 rounded-full border', styles[status] ?? 'bg-border text-text-muted border-border')}>
      {status}
    </span>
  );
}
