'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf,
  UserCircle,
  Package,
  Truck,
  Calendar,
  Info,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Scale,
  Search,
  CloudUpload,
  CheckCircle,
  Trash2,
  Plus,
} from 'lucide-react';
import { useToast } from '@/src/components/ui/toast';
import { createDeliveryFormSchema, type CreateDeliveryFormInput } from '@/lib/validations/delivery';
import type { PlaceResult, Driver, Vehicle, UploadedFile } from '@/utils/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const DEFAULT_HUB = { lng: 2.3522, lat: 48.8566 }; // Paris par défaut

export default function CreateLivraison() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [proofs, setProofs] = useState<UploadedFile[]>([]);
  const [uploadingProofs, setUploadingProofs] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<PlaceResult[]>([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [hub, setHub] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [routeMeta, setRouteMeta] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const proofsInputRef = useRef<HTMLInputElement | null>(null);
  const addressSuggestionsRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateDeliveryFormInput>({
    resolver: zodResolver(createDeliveryFormSchema) as Resolver<CreateDeliveryFormInput>,
    defaultValues: {
      companyName: '',
      contactName: '',
      phoneNumber: '',
      deliveryAddress: '',
      packageName: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      packageType: '',
      scheduledDate: '',
      scheduledTime: '',
      amount: '',
      currency: 'CFA',
      driverId: '',
      vehicleId: '',
    },
  });

  const deliveryAddress = watch('deliveryAddress');
  const weight = watch('weight');

  useEffect(() => {
    Promise.all([
      fetch('/api/drivers', { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])),
      fetch('/api/vehicles', { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([d, v]) => {
      setDrivers(d);
      setVehicles(v);
    });
  }, []);

  // Charger la position HUB (adresse entreprise) pour l'aperçu d'itinéraire
  useEffect(() => {
    const loadHub = async () => {
      try {
        const res = await fetch('/api/company', { credentials: 'include' });
        if (!res.ok || !MAPBOX_TOKEN) {
          setHub(DEFAULT_HUB);
          return;
        }
        const company = await res.json();
        if (company?.address) {
          const fullAddress = [company.address, company.city, company.country].filter(Boolean).join(', ');
          const geoRes = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${encodeURIComponent(
              MAPBOX_TOKEN
            )}&limit=1&language=fr`
          );
          const data = await geoRes.json();
          const center = data?.features?.[0]?.center as [number, number] | undefined;
          if (center) {
            setHub({ lng: center[0], lat: center[1] });
          } else {
            setHub(DEFAULT_HUB);
          }
        } else {
          setHub(DEFAULT_HUB);
        }
      } catch {
        setHub(DEFAULT_HUB);
      }
    };
    loadHub();
  }, []);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !deliveryAddress?.trim() || deliveryAddress.length < 3) {
      setAddressSuggestions([]);
      setSelectedPlace(null);
      setRouteMeta(null);
      return;
    }
    const t = setTimeout(() => {
      setAddressSearching(true);
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${encodeURIComponent(MAPBOX_TOKEN)}&autocomplete=true&limit=5&language=fr`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { features?: Array<{ id: string; place_name: string; center: [number, number] }> }) => {
          const list = (data?.features ?? []).map((f) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          }));
          setAddressSuggestions(list);
        })
        .catch(() => setAddressSuggestions([]))
        .finally(() => setAddressSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [deliveryAddress]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressSuggestionsRef.current && !addressSuggestionsRef.current.contains(e.target as Node)) {
        setAddressSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uploadToCloudinary = async (file: File, folder: string): Promise<UploadedFile> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload impossible');
    return data as UploadedFile;
  };

  const suggestedDriver = drivers.length > 0 ? drivers[0] : null;

  // Calculer un itinéraire entre HUB et adresse sélectionnée pour l'aperçu
  useEffect(() => {
    const computeRoute = async () => {
      if (!MAPBOX_TOKEN || !hub || !selectedPlace) return;
      try {
        const [lng, lat] = selectedPlace.center;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${hub.lng},${hub.lat};${lng},${lat}?geometries=geojson&overview=false&access_token=${encodeURIComponent(
          MAPBOX_TOKEN
        )}`;
        const res = await fetch(url);
        const data = await res.json();
        const route = data?.routes?.[0];
        if (route) {
          setRouteMeta({
            distanceKm: route.distance / 1000,
            durationMin: route.duration / 60,
          });
        }
      } catch {
        setRouteMeta(null);
      }
    };
    computeRoute();
  }, [hub, selectedPlace]);

  const onSubmit = async (data: CreateDeliveryFormInput) => {
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PENDING',
          amount: Number(data.amount),
          currency: data.currency,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          proofUrls: proofs.map((p) => p.url),
          packageName: data.packageName,
          recipientCompany: data.companyName,
          recipientName: data.contactName,
          recipientPhone: data.phoneNumber,
          deliveryAddress: data.deliveryAddress,
          weightKg: Number(data.weight),
          dimensionsL: Number(data.length),
          dimensionsW: Number(data.width),
          dimensionsH: Number(data.height),
          packageType: data.packageType,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
        }),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(responseData.error || 'Impossible de créer la livraison.');
        return;
      }
      showSuccess('Livraison créée avec succès !');
      router.push('/dashboard/deliveries');
    } catch {
      showError('Erreur réseau.');
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-text-main">Nouvelle livraison</h1>
            <p className="mt-2 text-text-muted">Remplissez tous les détails pour planifier un envoi.</p>
          </div>
          <Link href="/dashboard/deliveries" className="text-sm text-text-muted hover:text-text-main">
            ← Retour
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-sm">
              <div className="flex items-center mb-8">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-4">
                  <UserCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-text-main">Détails du destinataire</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Nom de l&apos;entreprise <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('companyName')}
                    className={`w-full bg-background border ${errors.companyName ? 'border-danger' : 'border-border'} rounded-xl text-text-main focus:ring-2 focus:ring-primary focus:border-transparent transition-all p-3`}
                    placeholder="ex: Acme Corp"
                  />
                  {errors.companyName && (
                    <p className="text-xs text-danger mt-1">{errors.companyName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Nom du contact <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('contactName')}
                    className={`w-full bg-background border ${errors.contactName ? 'border-danger' : 'border-border'} rounded-xl text-text-main focus:ring-2 focus:ring-primary p-3`}
                    placeholder="Jane Doe"
                  />
                  {errors.contactName && (
                    <p className="text-xs text-danger mt-1">{errors.contactName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Numéro de téléphone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('phoneNumber')}
                    className={`w-full bg-background border ${errors.phoneNumber ? 'border-danger' : 'border-border'} rounded-xl text-text-main focus:ring-2 focus:ring-primary p-3`}
                    placeholder="+237 6 50 51 77 00"
                  />
                  {errors.phoneNumber && (
                    <p className="text-xs text-danger mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>
                <div className="col-span-2 relative">
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Adresse de livraison <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      {...register('deliveryAddress')}
                      className={`w-full bg-background border ${errors.deliveryAddress ? 'border-danger' : 'border-border'} rounded-xl text-text-main pl-11 p-3 focus:ring-2 focus:ring-primary`}
                      placeholder="Commencez à taper une adresse..."
                      autoComplete="off"
                    />
                    {addressSearching && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                        Recherche…
                      </span>
                    )}
                  </div>
                  {errors.deliveryAddress && (
                    <p className="text-xs text-danger mt-1">{errors.deliveryAddress.message}</p>
                  )}
                  {addressSuggestions.length > 0 && (
                    <div
                      ref={addressSuggestionsRef}
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-xl z-50 overflow-hidden"
                    >
                      {addressSuggestions.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className="w-full text-left px-4 py-3 text-sm text-text-main hover:bg-border transition-colors"
                          onClick={() => {
                            setValue('deliveryAddress', r.place_name);
                            setAddressSuggestions([]);
                            setSelectedPlace(r);
                          }}
                        >
                          {r.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {!MAPBOX_TOKEN && (
                    <p className="text-xs text-amber-500 mt-1">
                      Configurez NEXT_PUBLIC_MAPBOX_TOKEN pour activer la recherche d&apos;adresse.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-surface rounded-2xl border border-border p-6 md:p-8">
              <div className="flex items-center mb-8">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-4">
                  <Package className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-text-main">Informations du colis</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Nom du colis <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('packageName')}
                    className={`w-full bg-background border ${errors.packageName ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-3 focus:ring-2 focus:ring-primary`}
                    placeholder="ex: Carton équipement client X"
                  />
                  {errors.packageName && (
                    <p className="text-xs text-danger mt-1">{errors.packageName.message}</p>
                  )}
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Poids total (kg) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Scale className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      {...register('weight')}
                      className={`w-full bg-background border ${errors.weight ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-3 focus:ring-2 focus:ring-primary`}
                      placeholder="0.0"
                    />
                  </div>
                  {errors.weight && <p className="text-xs text-danger mt-1">{errors.weight.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Dimensions (cm) <span className="text-danger">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div>
                      <input
                        type="number"
                        min={1}
                        {...register('length')}
                        className={`w-full bg-background border ${errors.length ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-3 focus:ring-2 focus:ring-primary`}
                        placeholder="L"
                      />
                      {errors.length && <p className="text-xs text-danger mt-1">{errors.length.message}</p>}
                    </div>
                    <div>
                      <input
                        type="number"
                        min={1}
                        {...register('width')}
                        className={`w-full bg-background border ${errors.width ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-3 focus:ring-2 focus:ring-primary`}
                        placeholder="l"
                      />
                      {errors.width && <p className="text-xs text-danger mt-1">{errors.width.message}</p>}
                    </div>
                    <div>
                      <input
                        type="number"
                        min={1}
                        {...register('height')}
                        className={`w-full bg-background border ${errors.height ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-3 focus:ring-2 focus:ring-primary`}
                        placeholder="H"
                      />
                      {errors.height && <p className="text-xs text-danger mt-1">{errors.height.message}</p>}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Type de colis <span className="text-danger">*</span>
                  </label>
                  <select
                    {...register('packageType')}
                    className={`w-full bg-background border ${errors.packageType ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-3 focus:ring-2 focus:ring-primary appearance-none`}
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="STANDARD">Boîte Standard</option>
                    <option value="FRAGILE">Fragile / Verre</option>
                    <option value="REFRIGERATED">Réfrigéré</option>
                  </select>
                  {errors.packageType && (
                    <p className="text-xs text-danger mt-1">{errors.packageType.message}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-surface rounded-2xl border border-border p-6 md:p-8">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-4">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-main">Assignation du chauffeur</h2>
                  <p className="text-sm text-text-muted">
                    Assignez un chauffeur ou utilisez l&apos;assignation automatique.
                  </p>
                </div>
              </div>
              {suggestedDriver && (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6 flex items-start gap-4">
                  <Info className="w-5 h-5 text-accent mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-text-main">Suggestion intelligente</h4>
                    <p className="text-sm text-text-muted mt-1">
                      Basé sur la proximité,{' '}
                      <span className="text-text-main font-medium">{suggestedDriver.name}</span> est le
                      meilleur choix.
                    </p>
                    <button
                      type="button"
                      onClick={() => setValue('driverId', suggestedDriver.id)}
                      className="mt-3 text-xs font-bold text-primary hover:text-primaryHover flex items-center gap-1 uppercase tracking-wider"
                    >
                      Assigner {suggestedDriver.name} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-text-muted">
                    Chauffeur <span className="text-danger">*</span>
                  </label>
                  <Link
                    href="/dashboard/fleet/new?returnTo=%2Fdashboard%2Fdeliveries%2Fnew"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Ajouter un chauffeur
                  </Link>
                </div>
                <select
                  {...register('driverId')}
                  className={`w-full bg-background border ${errors.driverId ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-4 focus:ring-2 focus:ring-primary`}
                >
                  <option value="">Sélectionner un chauffeur</option>
                  {drivers.length === 0 ? (
                    <option value="" disabled>
                      Pas de chauffeur
                    </option>
                  ) : (
                    drivers.map((d: any) => {
                      const isMaintenance = d.status === 'MAINTENANCE';
                      return (
                        <option
                          key={d.id}
                          value={d.id}
                          disabled={isMaintenance}
                          className={isMaintenance ? 'text-red-400' : undefined}
                        >
                          {d.name} • {d.code} {isMaintenance ? '(Maintenance)' : ''}
                        </option>
                      );
                    })
                  )}
                </select>
                {errors.driverId && (
                  <p className="text-xs text-danger mt-1">{errors.driverId.message}</p>
                )}
                {drivers.length === 0 && (
                  <p className="text-xs text-text-muted mt-1">
                    Aucun chauffeur. Ajoutez-en dans Performance / Flotte.
                  </p>
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm text-text-muted">Véhicule</span>
                  <Link
                    href="/dashboard/vehicles/new?returnTo=%2Fdashboard%2Fdeliveries%2Fnew"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Ajouter un véhicule
                  </Link>
                </div>
                <select
                  {...register('vehicleId')}
                  className={`w-full bg-background border ${errors.vehicleId ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-4 focus:ring-2 focus:ring-primary`}
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.length === 0 ? (
                    <option value="" disabled>
                      Pas de véhicule
                    </option>
                  ) : (
                    vehicles.map((v: any) => {
                      const isMaintenance = v.status === 'MAINTENANCE';
                      return (
                        <option
                          key={v.id}
                          value={v.id}
                          disabled={isMaintenance}
                          className={isMaintenance ? 'text-red-400' : undefined}
                        >
                          {v.name} {v.plateNumber ? `• ${v.plateNumber}` : ''} {isMaintenance ? '(Maintenance)' : ''}
                        </option>
                      );
                    })
                  )}
                </select>
                {errors.vehicleId && (
                  <p className="text-xs text-danger mt-1">{errors.vehicleId.message}</p>
                )}
                {vehicles.length === 0 && (
                  <p className="text-xs text-text-muted mt-1">
                    Aucun véhicule. Cliquez sur &quot;Ajouter un véhicule&quot; ci-dessus.
                  </p>
                )}
              </div>
            </section>

            <section className="bg-surface rounded-2xl border border-border p-6 md:p-8">
              <div className="flex items-center mb-8">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-text-main">Priorité et planification</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { id: 'eco', name: 'Éco-Saver', desc: '2-3 Jours', co2: '-0.8kg CO2', active: true },
                  { id: 'std', name: 'Standard', desc: 'Le lendemain', co2: 'Neutre', active: false },
                  {
                    id: 'rush',
                    name: 'Express',
                    desc: "Aujourd'hui",
                    co2: '+1.2kg CO2',
                    active: false,
                    danger: true,
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      item.active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background hover:border-text-muted'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-bold text-text-main">{item.name}</span>
                      {item.active && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <p className="text-sm text-text-muted">{item.desc}</p>
                    <div
                      className={`mt-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                        item.danger ? 'text-danger' : 'text-primary'
                      }`}
                    >
                      <Leaf className="w-3 h-3" /> {item.co2}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Date de livraison <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('scheduledDate')}
                    className={`w-full bg-background border ${errors.scheduledDate ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-3 focus:ring-2 focus:ring-primary`}
                  />
                  {errors.scheduledDate && (
                    <p className="text-xs text-danger mt-1">{errors.scheduledDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Heure de livraison <span className="text-danger">*</span>
                  </label>
                  <select
                    {...register('scheduledTime')}
                    className={`w-full bg-background border ${errors.scheduledTime ? 'border-danger' : 'border-border'} rounded-xl text-text-main p-3 focus:ring-2 focus:ring-primary`}
                  >
                    <option value="">Sélectionner une heure</option>
                    <option value="09:00-12:00">09:00 - 12:00</option>
                    <option value="12:00-15:00">12:00 - 15:00</option>
                    <option value="15:00-18:00">15:00 - 18:00</option>
                    <option value="ANYTIME">N&apos;importe quand</option>
                  </select>
                  {errors.scheduledTime && (
                    <p className="text-xs text-danger mt-1">{errors.scheduledTime.message}</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-surface rounded-2xl border border-border overflow-hidden group">
                <div className="h-48 w-full relative overflow-hidden">
                  {MAPBOX_TOKEN && selectedPlace ? (
                    <img
                      src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+13ec5b(${selectedPlace.center[0]},${selectedPlace.center[1]})/${selectedPlace.center[0]},${selectedPlace.center[1]},11,0/800x300?access_token=${encodeURIComponent(
                        MAPBOX_TOKEN
                      )}`}
                      alt="Aperçu de l'itinéraire"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-border" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 opacity-60" />
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                      Aperçu de l&apos;itinéraire
                    </span>
                    <p className="text-sm font-medium flex items-center gap-2 text-text-main">
                      Entrepôt <ArrowRight className="w-3 h-3" /> {selectedPlace?.place_name ?? 'Destination'}
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 z-20 bg-surface/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-border text-text-main">
                    {routeMeta ? `${routeMeta.distanceKm.toFixed(1)} km • ~${Math.round(routeMeta.durationMin)} min` : '— km'}
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl border border-border p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <h3 className="text-lg font-bold text-text-main mb-6">Estimation de livraison</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-5 bg-background rounded-xl border border-border col-span-2 min-h-[88px]">
                    <span className="text-[10px] text-text-muted uppercase font-bold">Coût estimé</span>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        {...register('amount')}
                        className="text-3xl md:text-4xl font-black text-text-main bg-transparent border-none outline-none w-full min-w-[140px] placeholder:text-text-muted/60"
                        placeholder="0.00"
                      />
                      <select {...register('currency')} className="text-base font-bold bg-transparent border-none outline-none text-text-muted py-1">
                        <option value="CFA">CFA</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <span className="text-[10px] text-primary uppercase font-bold">Carbone</span>
                    <p className="text-2xl font-black text-primary mt-1">0.45 kg</p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  {[
                    { label: 'Service', value: 'Éco-Saver' },
                    { label: 'Poids', value: weight ? `${weight} kg` : '—' },
                    { label: 'Compensation', value: 'Incluse', highlight: true },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-text-muted">{row.label}</span>
                      <span
                        className={`font-semibold ${row.highlight ? 'text-primary' : 'text-text-main'}`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                    Preuve / Reçu
                  </p>
                  <input
                    ref={proofsInputRef}
                    type="file"
                    multiple
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length === 0) return;
                      setUploadingProofs(true);
                      try {
                        for (const f of files) {
                          const uploaded = await uploadToCloudinary(f, 'delivery-proofs');
                          setProofs((prev) => [uploaded, ...prev]);
                        }
                      } catch (err) {
                        showError((err as Error).message || 'Upload impossible');
                      } finally {
                        setUploadingProofs(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => proofsInputRef.current?.click()}
                    disabled={uploadingProofs}
                    className="w-full flex items-center justify-center gap-2 border border-border rounded-xl px-3 py-2 text-xs font-medium text-text-main bg-background hover:bg-surface disabled:opacity-70 transition-colors"
                  >
                    <CloudUpload className="w-4 h-4" />
                    {uploadingProofs ? 'Upload en cours…' : 'Ajouter un reçu / preuve de livraison'}
                  </button>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {proofs.length === 0 ? (
                      <p className="text-[11px] text-text-muted">Aucun document attaché pour le moment.</p>
                    ) : (
                      proofs.map((p) => (
                        <div
                          key={p.publicId}
                          className="flex items-center justify-between gap-3 px-3 py-2 bg-background rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-xs font-medium text-text-main truncate hover:underline"
                              >
                                {p.originalFilename}
                              </a>
                              <p className="text-[10px] text-text-muted">{Math.round(p.bytes / 1024)} Ko</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProofs((prev) => prev.filter((x) => x.publicId !== p.publicId))}
                            className="text-text-muted hover:text-danger transition-colors"
                            aria-label="Retirer le document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-slate-950 font-bold py-4 px-6 rounded-xl hover:bg-primaryHover disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 mt-6"
                >
                  {isSubmitting ? 'Création...' : 'Créer la livraison'}{' '}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <Link
                  href="/dashboard/deliveries"
                  className="block w-full mt-3 py-3 text-sm font-medium text-text-muted hover:text-text-main transition-colors text-center"
                >
                  Annuler
                </Link>
              </div>
              <div className="bg-accent/10 rounded-2xl p-5 border border-accent/20 flex gap-4">
                <AlertCircle className="w-5 h-5 text-accent shrink-0" />
                <p className="text-xs text-text-muted leading-relaxed">
                  <span className="text-text-main font-semibold">Routage optimisé actif :</span> Fluvex
                  regroupe actuellement 3 autres livraisons dans cette zone.
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
