'use client';

import React, { FormEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

type UploadedFile = {
  url: string;
  publicId: string;
  bytes: number;
  originalFilename: string;
  mimeType: string;
};

export default function NewDriverPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<UploadedFile[]>([]);
  const [docsUploading, setDocsUploading] = useState(false);
  const docsInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});

  const uploadToCloudinary = async (file: File, folder: string): Promise<UploadedFile> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload impossible');
    return data as UploadedFile;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const err: { name?: string; email?: string } = {};
    if (!name.trim()) err.name = 'Le nom est requis.';
    if (!email.trim()) err.email = "L'adresse email est requise.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = 'Adresse email invalide.';
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          role: role || undefined,
          status: 'ACTIVE',
          region: undefined,
          avatarUrl: avatarUrl || undefined,
          vehicleId: vehicleId || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Impossible de créer le chauffeur.');
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
    <div className="bg-slate-50 dark:bg-background text-slate-800 dark:text-text-main min-h-screen font-sans antialiased transition-colors duration-200">
      <main className="max-w-5xl mx-auto py-8">
        <header className="mb-8">
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
                href="/dashboard/fleet"
                className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-border font-semibold text-slate-600 dark:text-text-muted hover:bg-slate-50 dark:hover:bg-surface hover:text-slate-900 dark:hover:text-text-main transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                form="new-driver-form"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-primary text-background font-bold hover:bg-primaryHover transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Enregistrement...' : 'Enregistrer le chauffeur'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <p className="mb-4 text-sm text-red-500 font-medium">{error}</p>
        )}

        <form
          id="new-driver-form"
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Personal Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Personal Information Card */}
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informations personnelles
                  </h2>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">Requis</span>
                </div>
                <div className="flex flex-col md:flex-row gap-8 mb-6">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setAvatarUploading(true);
                        setError(null);
                        try {
                          const uploaded = await uploadToCloudinary(f, 'avatars');
                          setAvatarUrl(uploaded.url);
                        } catch (err) {
                          setError((err as Error).message || 'Upload impossible');
                        } finally {
                          setAvatarUploading(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative w-24 h-24 group cursor-pointer"
                      disabled={avatarUploading}
                      aria-label="Télécharger une photo de profil"
                    >
                      <div className="w-full h-full rounded-full bg-slate-50 dark:bg-background overflow-hidden border-2 border-dashed border-slate-300 dark:border-border flex items-center justify-center group-hover:border-primary transition-colors">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-400 dark:text-text-muted group-hover:text-primary" />
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-primary text-background rounded-full p-1.5 border-2 border-white dark:border-surface">
                        <Pencil className="w-3 h-3 block" />
                      </div>
                      {avatarUploading && (
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-xs font-bold text-white">
                          Upload…
                        </div>
                      )}
                    </button>
                    <span className="text-sm font-medium text-slate-500 dark:text-text-muted">Photo de profil</span>
                  </div>
                  {/* Inputs Grid */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Nom légal complet
                      </label>
                      <input
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${fieldErrors.name ? 'border-red-500' : 'border-slate-200 dark:border-border'}`}
                        placeholder="ex. Jonathan Doe"
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined })); }}
                      />
                      {fieldErrors.name && <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Date de naissance</label>
                      <input className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" type="date" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Adresse e-mail
                      </label>
                      <input
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${fieldErrors.email ? 'border-red-500' : 'border-slate-200 dark:border-border'}`}
                        placeholder="john@fluvex.com"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined })); }}
                      />
                      {fieldErrors.email && <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Numéro de téléphone
                      </label>
                      <input
                        className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="+1 (555) 000-0000"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 dark:border-border grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Numéro de permis</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IdCard className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                      </span>
                      <input className="w-full pl-9 bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono" placeholder="DL-12345678" type="text" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Expiration du permis</label>
                    <input className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" type="date" />
                  </div>
                </div>
              </section>

              {/* Work Preferences */}
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Préférences de travail
                  </h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-3">Régions d'intervention</label>
                    <div className="flex flex-wrap gap-2">
                      {['Centre-ville Nord', 'Zone industrielle Ouest', 'Métro Sud', 'Zone Aéroport'].map((region, i) => (
                        <label key={region} className="cursor-pointer group">
                          <input defaultChecked={i % 2 === 0} className="peer sr-only" type="checkbox" />
                          <span className="px-4 py-2 rounded-full border border-slate-200 dark:border-border bg-slate-50 dark:bg-background text-sm text-slate-600 dark:text-text-muted peer-checked:bg-primary peer-checked:text-background peer-checked:border-primary peer-checked:font-semibold transition-all select-none hover:border-primary/50">
                            {region}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Quart de travail principal
                      </label>
                      <select className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer">
                        <option>Matin (06:00 - 14:00)</option>
                        <option>Après-midi (14:00 - 22:00)</option>
                        <option>Nuit (22:00 - 06:00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">
                        Type d'emploi
                      </label>
                      <select className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer">
                        <option>Temps plein</option>
                        <option>Temps partiel</option>
                        <option>Prestataire</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Vehicle & Documents */}
            <div className="space-y-6">
              
              {/* Vehicle Assignment */}
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Assignation de véhicule
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Sélectionner un véhicule</label>
                    <div className="relative">
                      <select
                        className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                      >
                        <option value="">Rechercher ou sélectionner...</option>
                        <option value="v1">Tesla Model Y (EV) - #FLEET-042</option>
                        <option value="v2">Ford E-Transit (EV) - #FLEET-089</option>
                        <option value="v3">Rivian R1T (EV) - #FLEET-101</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                      </span>
                    </div>
                  </div>
                  {/* Selected Vehicle Detail Preview */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-background border border-slate-200 dark:border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-white dark:bg-surface flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-border">
                        <Car className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-text-main">Tesla Model Y</h4>
                        <p className="text-xs text-slate-500 dark:text-text-muted">#FLEET-042</p>
                        <div className="mt-2 flex gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            Électrique
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-border text-slate-800 dark:text-text-muted">
                            Disponible
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Document Upload */}
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    Docs de conformité
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-text-muted mb-4">Veuillez télécharger des PDF ou JPG valides. Taille max 5 Mo.</p>
                <div className="space-y-4">
                  {/* Drag & Drop Zone */}
                  <input
                    ref={docsInputRef}
                    type="file"
                    multiple
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length === 0) return;
                      setDocsUploading(true);
                      setError(null);
                      try {
                        for (const f of files) {
                          const uploaded = await uploadToCloudinary(f, 'driver-docs');
                          setDocs((prev) => [uploaded, ...prev]);
                        }
                      } catch (err) {
                        setError((err as Error).message || 'Upload impossible');
                      } finally {
                        setDocsUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => docsInputRef.current?.click()}
                    disabled={docsUploading}
                    className="w-full border-2 border-dashed border-slate-300 dark:border-border rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-background hover:border-primary transition-colors cursor-pointer group disabled:opacity-70"
                  >
                    <CloudUpload className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-text-muted">
                      {docsUploading ? 'Upload en cours…' : 'Cliquez pour télécharger'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Permis, Assurance, Identité</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2">
                      Note: les URLs sont prêtes. La sauvegarde en base sera ajoutée après stabilisation des migrations Prisma.
                    </p>
                  </button>
                  {/* File List */}
                  <div className="space-y-3">
                    {docs.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-text-muted">Aucun document uploadé.</p>
                    ) : (
                      docs.map((d) => (
                        <div key={d.publicId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-background rounded-lg border border-slate-200 dark:border-border">
                          <div className="flex items-center gap-3 min-w-0">
                            <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                            <div className="min-w-0">
                              <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-900 dark:text-text-main truncate hover:underline block">
                                {d.originalFilename}
                              </a>
                              <p className="text-xs text-slate-500 dark:text-text-muted">{Math.round(d.bytes / 1024)} Ko</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDocs((prev) => prev.filter((x) => x.publicId !== d.publicId))}
                            className="text-slate-400 hover:text-danger transition-colors"
                            aria-label="Retirer le document"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}