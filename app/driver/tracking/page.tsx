'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Satellite, Play, Square } from 'lucide-react';

export default function DriverTrackingPage() {
  const router = useRouter();
  const [driverId, setDriverId] = useState('');
  const [deliveryId, setDeliveryId] = useState('');
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startTracking = () => {
    setError(null);
    if (!driverId.trim()) {
      setError("Veuillez renseigner l'identifiant chauffeur (driverId).");
      return;
    }
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('La géolocalisation n’est pas supportée sur cet appareil.');
      return;
    }

    if (tracking) return;

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const { latitude, longitude, heading, speed } = pos.coords;
          const payload = {
            driverId: driverId.trim(),
            deliveryId: deliveryId.trim() || null,
            lat: latitude,
            lng: longitude,
            heading: typeof heading === 'number' ? heading : null,
            speedKmh: typeof speed === 'number' ? speed * 3.6 : null,
          };
          const res = await fetch('/api/telemetry/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include',
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error || 'Envoi de position refusé.');
          } else {
            setStatus(`Dernière position envoyée à ${new Date().toLocaleTimeString('fr-FR')}`);
          }
        } catch (e) {
          setError((e as Error).message);
        }
      },
      (err) => {
        setError(`Erreur géolocalisation: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    watchIdRef.current = id;
    setTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current != null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setTracking(false);
  };

  return (
    <div className="min-h-screen bg-background text-text-main flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Suivi Chauffeur</h1>
            <p className="text-xs text-text-muted">
              Cette page est conçue pour être ouverte sur le téléphone du chauffeur pendant la livraison.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase block mb-1">Driver ID</label>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="ID du chauffeur (driverId)"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              disabled={tracking}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted uppercase block mb-1">Delivery ID (optionnel)</label>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="ID de la livraison (deliveryId)"
              value={deliveryId}
              onChange={(e) => setDeliveryId(e.target.value)}
              disabled={tracking}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {status && !error && <p className="text-xs text-emerald-400 font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> {status}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={tracking ? stopTracking : startTracking}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
              tracking ? 'bg-danger text-background hover:bg-danger/80' : 'bg-primary text-background hover:bg-primaryHover'
            }`}
          >
            {tracking ? <><Square className="w-4 h-4" /> Arrêter</> : <><Play className="w-4 h-4" /> Démarrer</>}
          </button>
          <button
            type="button"
            onClick={() => router.push('/driver/tracking')}
            className="px-4 py-3 rounded-xl border border-border text-xs font-bold text-text-muted hover:bg-border/30"
          >
            Voir carte
          </button>
        </div>

        <p className="text-[10px] text-text-muted leading-relaxed pt-2">
          Tant que le suivi est actif, la position GPS est envoyée régulièrement à l’API{' '}
          <code className="px-1 rounded bg-border/40 text-[10px]">/api/telemetry/location</code> et s’affiche sur la carte du
          dashboard.
        </p>
      </div>
    </div>
  );
}

