'use client';

import React, { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, Truck, ArrowLeft } from 'lucide-react';

export default function NewVehiclePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!name.trim()) {
      setFieldErrors({ name: 'Le nom du véhicule est requis.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          plateNumber: plateNumber.trim() || null,
          status: 'ACTIVE',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Impossible de créer le véhicule.');
        setSubmitting(false);
        return;
      }
      router.push('/dashboard/fleet');
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-text-main min-h-screen">
      <main className="max-w-2xl mx-auto py-8 px-4">
        <header className="mb-8">
          <Link
            href="/dashboard/fleet"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-main mb-4"
          >
            <ArrowLeft size={18} />
            Retour à la flotte
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="w-8 h-8 text-primary" />
            Ajouter un véhicule
          </h1>
          <p className="text-text-muted mt-1">
            Enregistrez un nouveau véhicule pour l&apos;assigner aux chauffeurs ou aux livraisons.
          </p>
        </header>

        {error && (
          <p className="mb-4 text-sm text-red-500 font-medium">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-6 shadow-xl space-y-6">
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5">
              Nom du véhicule <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }}
              placeholder="ex. Renault Master, Tesla Model Y"
              className={`w-full bg-background border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-primary outline-none ${fieldErrors.name ? 'border-red-500' : 'border-border'}`}
            />
            {fieldErrors.name && <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5">
              Immatriculation
            </label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="ex. AB-123-CD"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Link
              href="/dashboard/fleet"
              className="flex-1 py-3 rounded-xl border border-border text-text-main font-medium text-center hover:bg-border/50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-primary text-background font-bold flex items-center justify-center gap-2 hover:bg-primaryHover disabled:opacity-70 transition-colors"
            >
              <Save size={18} />
              {submitting ? 'Enregistrement…' : 'Enregistrer le véhicule'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
