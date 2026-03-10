'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/src/components/ui/toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Save,
  User,
  Camera,
  Pencil,
  IdCard,
  Briefcase,
  Truck,
  ChevronDown,
  Car,
  FolderOpen,
  CloudUpload,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { createDriverFormSchema, type CreateDriverFormInput } from '@/lib/validations/driver';
import type { UploadedFile } from '@/utils/types';

export default function NewDriverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard/fleet';
  const { showError, showSuccess } = useToast();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const docsInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [docsUploading, setDocsUploading] = useState(false);
  const [docs, setDocs] = useState<UploadedFile[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; name: string; plateNumber: string | null }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateDriverFormInput>({
    resolver: zodResolver(createDriverFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      birthDate: '',
      licenseNumber: '',
      licenseExpiry: '',
      employmentType: 'Temps plein',
      shift: 'Matin (06:00 - 14:00)',
      vehicleId: '',
      avatarUrl: '',
      docs: [],
    },
  });

  const avatarUrl = watch('avatarUrl');

  useEffect(() => {
    fetch('/api/vehicles', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setVehicles(Array.isArray(data) ? data : []))
      .catch(() => setVehicles([]));
  }, []);

  const uploadToCloudinary = async (file: File, folder: string): Promise<UploadedFile> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showError(data.error || 'Upload impossible');
      throw new Error(data.error || 'Upload impossible');
    }
    return data as UploadedFile;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarUploading(true);
    try {
      const uploaded = await uploadToCloudinary(f, 'avatars');
      setValue('avatarUrl', uploaded.url, { shouldValidate: true });
    } catch (err) {
      // Error already shown in uploadToCloudinary
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleDocsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setDocsUploading(true);
    try {
      for (const f of files) {
        const uploaded = await uploadToCloudinary(f, 'driver-docs');
        const newDocs = [...docs, uploaded];
        setDocs(newDocs);
        setValue(
          'docs',
          newDocs.map((d) => ({ url: d.url, publicId: d.publicId, originalFilename: d.originalFilename })),
          { shouldValidate: true }
        );
      }
    } catch {
      // Error already shown
    } finally {
      setDocsUploading(false);
      e.target.value = '';
    }
  };

  const removeDoc = (publicId: string) => {
    const newDocs = docs.filter((x) => x.publicId !== publicId);
    setDocs(newDocs);
    setValue(
      'docs',
      newDocs.map((d) => ({ url: d.url, publicId: d.publicId, originalFilename: d.originalFilename })),
      { shouldValidate: true }
    );
  };

  const onSubmit = async (data: CreateDriverFormInput) => {
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          vehicleId: data.vehicleId || undefined,
          status: 'ACTIVE',
          licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        showError(errData.error || 'Erreur lors de la création.');
        throw new Error(errData.error || 'Erreur lors de la création.');
      }
      showSuccess('Chauffeur ajouté avec succès');
      router.push(returnTo);
    } catch (err) {
      showError((err as Error).message);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-background text-slate-800 dark:text-text-main min-h-screen font-sans antialiased transition-colors duration-200">
      <main className="max-w-5xl mx-auto py-8">
        <header className="mb-8 px-4 md:px-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-text-main tracking-tight">
                Ajouter un nouveau chauffeur
              </h1>
              <p className="text-slate-500 dark:text-text-muted mt-1">
                Intégrez un nouveau chauffeur, assignez des véhicules et gérez la conformité.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={returnTo}
                className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-border font-semibold text-slate-600 dark:text-text-muted hover:bg-slate-50 dark:hover:bg-surface transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                form="new-driver-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-primary text-background font-bold hover:bg-primaryHover transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer le chauffeur'}
              </button>
            </div>
          </div>
        </header>

        {errors.root && (
          <div className="mx-4 md:mx-0 mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
            {errors.root.message}
          </div>
        )}

        <form id="new-driver-form" className="space-y-6 px-4 md:px-0" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informations personnelles
                  </h2>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                    Requis
                  </span>
                </div>
                <div className="flex flex-col md:flex-row gap-8 mb-6">
                  <div className="flex flex-col items-center gap-3">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className={`relative w-24 h-24 group rounded-full border-2 border-dashed transition-colors ${
                        errors.avatarUrl ? 'border-red-500' : 'border-slate-300 dark:border-border'
                      }`}
                      disabled={avatarUploading}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-background">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-400 group-hover:text-primary" />
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-primary text-background rounded-full p-1.5 border-2 border-white dark:border-surface">
                        <Pencil className="w-3 h-3" />
                      </div>
                    </button>
                    <span className="text-sm font-medium text-slate-500">Photo de profil</span>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Nom légal complet <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...register('name')}
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${
                          errors.name ? 'border-red-500' : 'border-slate-200 dark:border-border'
                        }`}
                        type="text"
                        placeholder="ex. Jonathan Doe"
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Date de naissance <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...register('birthDate')}
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${
                          errors.birthDate ? 'border-red-500' : 'border-slate-200 dark:border-border'
                        }`}
                        type="date"
                      />
                      {errors.birthDate && <p className="mt-1 text-xs text-red-500">{errors.birthDate.message}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Adresse e-mail <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...register('email')}
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${
                          errors.email ? 'border-red-500' : 'border-slate-200 dark:border-border'
                        }`}
                        type="email"
                        placeholder="john@fluvex.com"
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Numéro de téléphone <span className="text-red-400">*</span>
                      </label>
                      <input
                        {...register('phone')}
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${
                          errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-border'
                        }`}
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 dark:border-border grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                      Numéro de permis <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        {...register('licenseNumber')}
                        className={`w-full pl-9 bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary font-mono ${
                          errors.licenseNumber ? 'border-red-500' : 'border-slate-200 dark:border-border'
                        }`}
                        placeholder="DL-12345678"
                        type="text"
                      />
                      {errors.licenseNumber && (
                        <p className="mt-1 text-xs text-red-500">{errors.licenseNumber.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                      Expiration du permis <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register('licenseExpiry')}
                      className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${
                        errors.licenseExpiry ? 'border-red-500' : 'border-slate-200 dark:border-border'
                      }`}
                      type="date"
                    />
                    {errors.licenseExpiry && (
                      <p className="mt-1 text-xs text-red-500">{errors.licenseExpiry.message}</p>
                    )}
                  </div>
                </div>
              </section>
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2 mb-6">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Préférences de travail
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-3">
                      Régions d&apos;intervention (Optionnel)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Centre-ville Nord', 'Zone industrielle Ouest', 'Métro Sud', 'Zone Aéroport'].map(
                        (region, i) => (
                          <label key={region} className="cursor-pointer">
                            <input defaultChecked={i % 2 === 0} className="peer sr-only" type="checkbox" />
                            <span className="px-4 py-2 rounded-full border border-slate-200 dark:border-border bg-slate-50 dark:bg-background text-sm text-slate-600 dark:text-text-muted peer-checked:bg-primary peer-checked:text-background peer-checked:border-primary peer-checked:font-semibold transition-all hover:border-primary/50">
                              {region}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Quart de travail principal
                      </label>
                      <select {...register('shift')} className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none cursor-pointer">
                        <option>Matin (06:00 - 14:00)</option>
                        <option>Après-midi (14:00 - 22:00)</option>
                        <option>Nuit (22:00 - 06:00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Type d&apos;emploi
                      </label>
                      <select {...register('employmentType')} className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none cursor-pointer">
                        <option>Temps plein</option>
                        <option>Temps partiel</option>
                        <option>Prestataire</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="space-y-6">
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2 mb-6">
                  <Truck className="w-5 h-5 text-primary" />
                  Assignation de véhicule
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                      Sélectionner un véhicule{' '}
                      <span className="text-slate-400 font-normal">(optionnel)</span>
                    </label>
                    <div className="relative">
                      <select
                        {...register('vehicleId')}
                        className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none appearance-none cursor-pointer pr-10"
                      >
                        <option value="">Aucun véhicule</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} {v.plateNumber ? `(${v.plateNumber})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {vehicles.length === 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        Aucun véhicule enregistré. Enregistrez des véhicules dans la flotte.
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-background border border-slate-200 dark:border-border/50 flex gap-3">
                    <div className="w-12 h-12 rounded bg-white dark:bg-surface flex items-center justify-center shrink-0 border border-slate-100 dark:border-border shadow-sm">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-text-main">Info Véhicule</h4>
                      <p className="text-xs text-slate-500">Sélectionnez un véhicule pour voir les détails.</p>
                    </div>
                  </div>
                </div>
              </section>
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2 mb-4">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  Docs de conformité <span className="text-red-400">*</span>
                </h2>
                <p className="text-xs text-slate-500 mb-4">PDF ou JPG valides. Max 5 Mo.</p>
                <input
                  ref={docsInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={handleDocsUpload}
                />
                <button
                  type="button"
                  onClick={() => docsInputRef.current?.click()}
                  disabled={docsUploading}
                  className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors group disabled:opacity-70 ${
                    errors.docs ? 'border-red-500 bg-red-50/30' : 'border-slate-300 dark:border-border hover:border-primary'
                  }`}
                >
                  <CloudUpload
                    className={`w-10 h-10 mx-auto mb-2 transition-colors ${
                      errors.docs ? 'text-red-400' : 'text-slate-300 group-hover:text-primary'
                    }`}
                  />
                  <p className="text-sm font-medium text-slate-700">{docsUploading ? 'Upload...' : 'Cliquez pour télécharger'}</p>
                  <p className="text-xs text-slate-400 mt-1">Permis, Assurance, Identité</p>
                </button>
                <div className="mt-4 space-y-3">
                  {docs.map((d) => (
                    <div
                      key={d.publicId}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-background rounded-lg border border-slate-200 dark:border-border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.originalFilename}</p>
                          <p className="text-xs text-slate-500">{Math.round(d.bytes / 1024)} Ko</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDoc(d.publicId)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.docs && <p className="mt-1 text-xs text-red-500">{errors.docs.message}</p>}
              </section>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
