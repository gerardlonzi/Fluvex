'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, Truck, ChevronRight } from 'lucide-react';
import { useToast } from '@/src/components/ui/toast';
import { createVehicleFormSchema, type CreateVehicleFormInput } from '@/lib/validations/vehicle';

export default function NewVehiclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard/vehicles';
  const { showError, showSuccess } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateVehicleFormInput>({
    resolver: zodResolver(createVehicleFormSchema),
    defaultValues: { name: '', plateNumber: '' },
  });

  const onSubmit = async (data: CreateVehicleFormInput) => {
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          plateNumber: data.plateNumber.trim() || null,
          status: 'ACTIVE',
        }),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(responseData.error || 'Impossible de créer le véhicule.');
        setError('root', { message: responseData.error || 'Impossible de créer le véhicule.' });
        return;
      }
      showSuccess('Véhicule ajouté avec succès');
      router.push(returnTo);
    } catch {
      showError('Erreur réseau, veuillez réessayer.');
      setError('root', { message: 'Erreur réseau, veuillez réessayer.' });
    }
  };

  return (
    <div className="bg-background text-text-main min-h-screen">
      <main className="max-w-2xl mx-auto py-8 px-4">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="w-8 h-8 text-primary" />
            Ajouter un véhicule
          </h1>
          <p className="text-text-muted mt-1">
            Enregistrez un nouveau véhicule pour l&apos;assigner aux chauffeurs ou aux livraisons.
          </p>
        </header>

        {errors.root && (
          <p className="mb-4 text-sm text-red-500 font-medium">{errors.root.message}</p>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface rounded-2xl border border-border p-6 shadow-xl space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5">
              Nom du véhicule <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="ex. Renault Master, Tesla Model Y"
              className={`w-full bg-background border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-primary outline-none ${errors.name ? 'border-red-500' : 'border-border'}`}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5">
              Immatriculation
            </label>
            <input
              type="text"
              {...register('plateNumber')}
              placeholder="ex. AB-123-CD"
              className={`w-full bg-background border rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-primary outline-none ${errors.plateNumber ? 'border-red-500' : 'border-border'}`}
            />
            {errors.plateNumber && <p className="text-sm text-red-500 mt-1">{errors.plateNumber.message}</p>}
          </div>
          <div className="flex gap-3 pt-4">
            <Link
              href={returnTo}
              className="flex-1 py-3 rounded-xl border border-border text-text-main font-medium text-center hover:bg-border/50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-primary text-background font-bold flex items-center justify-center gap-2 hover:bg-primaryHover disabled:opacity-70 transition-colors"
            >
              <Save size={18} />
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer le véhicule'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
