'use client';

import React, { FormEvent, useRef, useState } from 'react';
import { useToast } from '@/src/components/ui/toast';
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

type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  avatarUrl?: string;
  docs?: string;
};

export default function NewDriverPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [employmentType, setEmploymentType] = useState('Temps plein');
  const [shift, setShift] = useState('Matin (06:00 - 14:00)');
  const [vehicleId, setVehicleId] = useState('');

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<UploadedFile[]>([]);
  const [docsUploading, setDocsUploading] = useState(false);
  const docsInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Fonction pour calculer l'âge à partir de la date de naissance
  const calculateAge = (birth: string): number => {
    if (!birth) return 0;
    const birthDateObj = new Date(birth);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const err: FieldErrors = {};

    // Validations existantes
    if (!name.trim()) err.name = 'Le nom est requis.';
    if (!email.trim()) err.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = 'Email invalide.';
    if (!phone.trim()) err.phone = 'Le téléphone est requis.';
    if (!birthDate) err.birthDate = 'La date de naissance est requise.';
    if (!licenseNumber.trim()) err.licenseNumber = 'Le numéro de permis est requis.';
    if (!licenseExpiry) err.licenseExpiry = "La date d'expiration est requise.";
    if (!avatarUrl) err.avatarUrl = 'Une photo est requise.';
    if (docs.length === 0) err.docs = 'Au moins un document est requis.';

    // Nouvelle validation : Âge minimum 18 ans
    if (birthDate) {
      const age = calculateAge(birthDate);
      if (age < 18) {
        err.birthDate = 'Le chauffeur doit avoir au moins 18 ans.';
      }
    }

    // Nouvelle validation : Date d'expiration du permis > aujourd'hui
    if (licenseExpiry) {
      const expiryDate = new Date(licenseExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Ignorer l'heure pour comparaison juste
      if (expiryDate <= today) {
        err.licenseExpiry = 'Le permis doit être valide (expiration future).';
      }
    }

    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      setError("Veuillez corriger les erreurs indiquées.");
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
          phone,
          birthDate,
          licenseNumber,
          licenseExpiry,
          employmentType,
          shift,
          avatarUrl,
          vehicleId: vehicleId || undefined,
          documents: docs.map(d => ({ url: d.url, name: d.originalFilename })),
          status: 'ACTIVE'
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showError(data.error || 'Erreur lors de la création.');
        throw new Error(data.error || 'Erreur lors de la création.');
      }

      showSuccess("Chauffeur ajouté avec succès");
      router.push('/dashboard/fleet');
    } catch (err: any) {
      showError(err.message);
      setError(err.message);
    } finally {
      setSubmitting(false);
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
                href="/dashboard/fleet"
                className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-border font-semibold text-slate-600 dark:text-text-muted hover:bg-slate-50 dark:hover:bg-surface transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                form="new-driver-form"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-primary text-background font-bold hover:bg-primaryHover transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Enregistrement...' : 'Enregistrer le chauffeur'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mx-4 md:mx-0 mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form id="new-driver-form" className="space-y-6 px-4 md:px-0" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informations personnelles
                  </h2>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">Requis</span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 mb-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setAvatarUploading(true);
                        try {
                          const uploaded = await uploadToCloudinary(f, 'avatars');
                          setAvatarUrl(uploaded.url);
                          setFieldErrors(p => ({...p, avatarUrl: undefined}));
                        } catch (err: any) { setError(err.message); }
                        finally { setAvatarUploading(false); }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className={`relative w-24 h-24 group rounded-full border-2 border-dashed transition-colors ${fieldErrors.avatarUrl ? 'border-red-500' : 'border-slate-300 dark:border-border'}`}
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

                  {/* Inputs */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Nom légal complet <span className="text-red-400">*</span></label>
                      <input
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${fieldErrors.name ? 'border-red-500' : 'border-slate-200 dark:border-border'}`}
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({...p, name: undefined})); }}
                        placeholder="ex. Jonathan Doe"
                      />
                      {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Date de naissance <span className="text-red-400">*</span></label>
                      <input 
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${fieldErrors.birthDate ? 'border-red-500' : 'border-slate-200 dark:border-border'}`}
                        type="date" 
                        value={birthDate}
                        onChange={(e) => { setBirthDate(e.target.value); setFieldErrors(p => ({...p, birthDate: undefined})); }}
                      />
                      {fieldErrors.birthDate && <p className="mt-1 text-xs text-red-500">{fieldErrors.birthDate}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Adresse e-mail <span className="text-red-400">*</span></label>
                      <input
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${fieldErrors.email ? 'border-red-500' : 'border-slate-200 dark:border-border'}`}
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: undefined})); }}
                        placeholder="john@fluvex.com"
                      />
                      {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Numéro de téléphone <span className="text-red-400">*</span></label>
                      <input
                        className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${fieldErrors.phone ? 'border-red-500' : 'border-slate-200 dark:border-border'}`}
                        type="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setFieldErrors(p => ({...p, phone: undefined})); }}
                        placeholder="+33 6 12 34 56 78"
                      />
                      {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-border grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Numéro de permis <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        className={`w-full pl-9 bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary font-mono ${fieldErrors.licenseNumber ? 'border-red-500' : 'border-slate-200 dark:border-border'}`}
                        placeholder="DL-12345678" 
                        type="text" 
                        value={licenseNumber}
                        onChange={(e) => { setLicenseNumber(e.target.value); setFieldErrors(p => ({...p, licenseNumber: undefined})); }}
                      />
                      {fieldErrors.licenseNumber && <p className="mt-1 text-xs text-red-500">{fieldErrors.licenseNumber}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Expiration du permis <span className="text-red-400">*</span></label>
                    <input
                      className={`w-full bg-slate-50 dark:bg-background border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none focus:ring-1 focus:ring-primary ${fieldErrors.licenseExpiry ? 'border-red-500' : 'border-slate-200 dark:border-border'}`}
                      type="date"
                      value={licenseExpiry}
                      onChange={(e) => { setLicenseExpiry(e.target.value); setFieldErrors(p => ({...p, licenseExpiry: undefined})); }}
                    />
                    {fieldErrors.licenseExpiry && <p className="mt-1 text-xs text-red-500">{fieldErrors.licenseExpiry}</p>}
                  </div>
                </div>
              </section>

              {/* Work Preferences (inchangé) */}
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2 mb-6">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Préférences de travail
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-3">Régions d'intervention (Optionnel)</label>
                    <div className="flex flex-wrap gap-2">
                      {['Centre-ville Nord', 'Zone industrielle Ouest', 'Métro Sud', 'Zone Aéroport'].map((region, i) => (
                        <label key={region} className="cursor-pointer">
                          <input defaultChecked={i % 2 === 0} className="peer sr-only" type="checkbox" />
                          <span className="px-4 py-2 rounded-full border border-slate-200 dark:border-border bg-slate-50 dark:bg-background text-sm text-slate-600 dark:text-text-muted peer-checked:bg-primary peer-checked:text-background peer-checked:border-primary peer-checked:font-semibold transition-all hover:border-primary/50">
                            {region}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Quart de travail principal</label>
                      <select 
                        className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none cursor-pointer"
                        value={shift}
                        onChange={(e) => setShift(e.target.value)}
                      >
                        <option>Matin (06:00 - 14:00)</option>
                        <option>Après-midi (14:00 - 22:00)</option>
                        <option>Nuit (22:00 - 06:00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Type d'emploi</label>
                      <select 
                        className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none cursor-pointer"
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                      >
                        <option>Temps plein</option>
                        <option>Temps partiel</option>
                        <option>Prestataire</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column (inchangé) */}
            <div className="space-y-6">
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2 mb-6">
                  <Truck className="w-5 h-5 text-primary" />
                  Assignation de véhicule
                </h2>
                <div className="space-y-4">
                  <div className="relative">
                    <select
                      className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main outline-none appearance-none cursor-pointer"
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                    >
                      <option value="">Rechercher ou sélectionner...</option>
                      <option value="v1">Tesla Model Y (EV) - #FLEET-042</option>
                      <option value="v2">Ford E-Transit (EV) - #FLEET-089</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
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
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length === 0) return;
                    setDocsUploading(true);
                    try {
                      for (const f of files) {
                        const uploaded = await uploadToCloudinary(f, 'driver-docs');
                        setDocs((prev) => [uploaded, ...prev]);
                        setFieldErrors(p => ({...p, docs: undefined}));
                      }
                    } catch (err: any) { setError(err.message); }
                    finally { setDocsUploading(false); e.target.value = ''; }
                  }}
                />
                <button
                  type="button"
                  onClick={() => docsInputRef.current?.click()}
                  disabled={docsUploading}
                  className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors group disabled:opacity-70 ${fieldErrors.docs ? 'border-red-500 bg-red-50/30' : 'border-slate-300 dark:border-border hover:border-primary'}`}
                >
                  <CloudUpload className={`w-10 h-10 mx-auto mb-2 transition-colors ${fieldErrors.docs ? 'text-red-400' : 'text-slate-300 group-hover:text-primary'}`} />
                  <p className="text-sm font-medium text-slate-700">{docsUploading ? 'Upload...' : 'Cliquez pour télécharger'}</p>
                  <p className="text-xs text-slate-400 mt-1">Permis, Assurance, Identité</p>
                </button>

                <div className="mt-4 space-y-3">
                  {docs.map((d) => (
                    <div key={d.publicId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-background rounded-lg border border-slate-200 dark:border-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.originalFilename}</p>
                          <p className="text-xs text-slate-500">{Math.round(d.bytes / 1024)} Ko</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDocs(prev => prev.filter(x => x.publicId !== d.publicId))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}