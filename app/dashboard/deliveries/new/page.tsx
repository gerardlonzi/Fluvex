'use client';

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf, ChevronRight, UserCircle, Package, Truck, Calendar,
  Info, ArrowRight, CheckCircle2, AlertCircle, MapPin, Scale, Search,
  CloudUpload, CheckCircle, Trash2, Plus,
} from 'lucide-react';
import { useToast } from '@/src/components/ui/toast';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
type PlaceResult = { id: string; place_name: string; center: [number, number] };

type Driver = { id: string; name: string; code: string };
type Vehicle = { id: string; name: string; plateNumber: string | null };

type UploadedFile = {
  url: string;
  publicId: string;
  bytes: number;
  originalFilename: string;
  mimeType: string;
};

export default function CreateLivraison() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('CFA');
  const [proofs, setProofs] = useState<UploadedFile[]>([]);
  const [uploadingProofs, setUploadingProofs] = useState(false);
  const proofsInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Champs requis
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [packageType, setPackageType] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<PlaceResult[]>([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const addressSuggestionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/drivers', { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])),
      fetch('/api/vehicles', { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([d, v]) => {
      setDrivers(d);
      setVehicles(v);
    });
  }, []);

  /* Recherche d'adresse Mapbox (debounce) */
  useEffect(() => {
    if (!MAPBOX_TOKEN || !deliveryAddress.trim() || deliveryAddress.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      setAddressSearching(true);
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${encodeURIComponent(MAPBOX_TOKEN)}&autocomplete=true&limit=5&language=fr`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { features?: Array<{ id: string; place_name: string; center: [number, number] }> }) => {
          const list = (data?.features ?? []).map((f) => ({ id: f.id, place_name: f.place_name, center: f.center }));
          setAddressSuggestions(list);
        })
        .catch(() => setAddressSuggestions([]))
        .finally(() => setAddressSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [deliveryAddress]);

  const uploadToCloudinary = async (file: File, folder: string): Promise<UploadedFile> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload impossible');
    return data as UploadedFile;
  };

  const validateForm = (): string | null => {
    if (!companyName.trim()) return 'Le nom de l\'entreprise est requis';
    if (!contactName.trim()) return 'Le nom du contact est requis';
    if (!phoneNumber.trim()) return 'Le numéro de téléphone est requis';
    if (!deliveryAddress.trim()) return 'L\'adresse de livraison est requise';
    if (!weight.trim() || Number(weight) <= 0) return 'Le poids est requis et doit être supérieur à 0';
    if (!length.trim() || Number(length) <= 0) return 'La longueur est requise';
    if (!width.trim() || Number(width) <= 0) return 'La largeur est requise';
    if (!height.trim() || Number(height) <= 0) return 'La hauteur est requise';
    if (!packageType.trim()) return 'Le type de colis est requis';
    if (!scheduledDate.trim()) return 'La date de livraison est requise';
    if (!scheduledTime.trim()) return 'L\'heure de livraison est requise';
    if (!amount.trim() || Number(amount) <= 0) return 'Le prix de livraison est requis';
    if (!driverId.trim()) return 'Un chauffeur doit être sélectionné';
    if (!vehicleId.trim()) return 'Un véhicule doit être sélectionné';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PENDING',
          amount: Number(amount),
          currency: currency,
          driverId: driverId,
          vehicleId: vehicleId,
          proofUrls: proofs.map((p) => p.url),
          recipientCompany: companyName,
          recipientName: contactName,
          recipientPhone: phoneNumber,
          deliveryAddress: deliveryAddress,
          weight: Number(weight),
          dimensions: { length: Number(length), width: Number(width), height: Number(height) },
          packageType: packageType,
          scheduledDate: scheduledDate,
          scheduledTime: scheduledTime,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(data.error || 'Impossible de créer la livraison.');
        setSubmitting(false);
        return;
      }
      showSuccess('Livraison créée avec succès !');
      router.push('/dashboard/deliveries');
    } catch {
      showError('Erreur réseau.');
      setSubmitting(false);
    }
  };

  // Suggestion intelligente de chauffeur
  const suggestedDriver = drivers.length > 0 ? drivers[0] : null;

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-[#f8fafc] antialiased">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#f8fafc]">Nouvelle livraison</h1>
            <p className="mt-2 text-[#94a3b8]">Remplissez tous les détails pour planifier un envoi.</p>
          </div>
          <Link href="/dashboard/deliveries" className="text-sm text-[#94a3b8] hover:text-[#f8fafc]">← Retour</Link>
        </div>

        <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Formulaire Principal */}
          <div className="lg:col-span-8 space-y-8">
            {/* Recipient Details */}
            <section className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 md:p-8 shadow-sm">
              <div className="flex items-center mb-8">
                <div className="h-10 w-10 rounded-xl bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b] mr-4">
                  <UserCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-[#f8fafc]">Détails du destinataire</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Nom de l'entreprise <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl text-[#f8fafc] focus:ring-2 focus:ring-[#13ec5b] focus:border-transparent transition-all p-3" 
                    placeholder="ex: Acme Corp" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Nom du contact <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl text-[#f8fafc] focus:ring-2 focus:ring-[#13ec5b] p-3" 
                    placeholder="Jane Doe" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Numéro de téléphone <span className="text-red-400">*</span></label>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#020617] border border-[#1e293b] rounded-xl text-[#f8fafc] focus:ring-2 focus:ring-[#13ec5b] p-3" 
                    placeholder="+33 6 00 00 00 00" 
                  />
                </div>
                <div className="col-span-2 relative">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Adresse de livraison <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                    <input 
                      type="text" 
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-xl text-[#f8fafc] pl-11 p-3 focus:ring-2 focus:ring-[#13ec5b]" 
                      placeholder="Commencez à taper une adresse..." 
                      autoComplete="off"
                    />
                    {addressSearching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94a3b8]">Recherche…</span>}
                  </div>
                  {addressSuggestions.length > 0 && (
                    <div ref={addressSuggestionsRef} className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-[#1e293b] bg-[#0f172a] shadow-xl z-50 overflow-hidden">
                      {addressSuggestions.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className="w-full text-left px-4 py-3 text-sm text-[#f8fafc] hover:bg-[#1e293b] transition-colors"
                          onClick={() => {
                            setDeliveryAddress(r.place_name);
                            setAddressSuggestions([]);
                          }}
                        >
                          {r.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {!MAPBOX_TOKEN && (
                    <p className="text-xs text-amber-500 mt-1">Configurez NEXT_PUBLIC_MAPBOX_TOKEN pour activer la recherche d&apos;adresse.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Package Info */}
            <section className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 md:p-8">
              <div className="flex items-center mb-8">
                <div className="h-10 w-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] mr-4">
                  <Package className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">Informations du colis</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Poids total (kg) <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Scale className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    <input 
                      type="number" 
                      min={0.1}
                      step={0.1}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]" 
                      placeholder="0.0" 
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Dimensions (cm) <span className="text-red-400">*</span></label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min={1}
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]" 
                      placeholder="L" 
                    />
                    <input 
                      type="number" 
                      min={1}
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]" 
                      placeholder="l" 
                    />
                    <input 
                      type="number" 
                      min={1}
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]" 
                      placeholder="H" 
                    />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Type de colis <span className="text-red-400">*</span></label>
                  <select 
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b] appearance-none"
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="STANDARD">Boîte Standard</option>
                    <option value="FRAGILE">Fragile / Verre</option>
                    <option value="REFRIGERATED">Réfrigéré</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Driver Assignment */}
            <section className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 md:p-8">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 rounded-xl bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b] mr-4">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Assignation du chauffeur</h2>
                  <p className="text-sm text-[#94a3b8]">Assignez un chauffeur ou utilisez l'assignation automatique.</p>
                </div>
              </div>
              
              {suggestedDriver && (
                <div className="bg-[#6366f1]/5 border border-[#6366f1]/20 rounded-xl p-4 mb-6 flex items-start gap-4">
                  <Info className="w-5 h-5 text-[#6366f1] mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-[#f8fafc]">Suggestion intelligente</h4>
                    <p className="text-sm text-[#94a3b8] mt-1">
                      Basé sur la proximité, <span className="text-[#f8fafc] font-medium">{suggestedDriver.name}</span> est le meilleur choix.
                    </p>
                    <button 
                      type="button"
                      onClick={() => setDriverId(suggestedDriver.id)}
                      className="mt-3 text-xs font-bold text-[#13ec5b] hover:text-[#10b981] flex items-center gap-1 uppercase tracking-wider"
                    >
                      Assigner {suggestedDriver.name} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <select
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl text-[#f8fafc] p-4 focus:ring-2 focus:ring-[#13ec5b]"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                >
                  <option value="">Sélectionner un chauffeur</option>
                  {drivers.length === 0 ? (
                    <option value="" disabled>Pas de chauffeur</option>
                  ) : (
                    drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} • {d.code}</option>
                    ))
                  )}
                </select>
                {drivers.length === 0 && (
                  <p className="text-xs text-[#94a3b8] mt-1">Aucun chauffeur. Ajoutez-en dans Performance / Flotte.</p>
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm text-[#94a3b8]">Véhicule</span>
                  <Link href="/dashboard/fleet/vehicle/new" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ajouter un véhicule
                  </Link>
                </div>
                <select
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl text-[#f8fafc] p-4 focus:ring-2 focus:ring-[#13ec5b]"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.length === 0 ? (
                    <option value="" disabled>Pas de véhicule</option>
                  ) : (
                    vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} {v.plateNumber ? `• ${v.plateNumber}` : ''}</option>
                    ))
                  )}
                </select>
                {vehicles.length === 0 && (
                  <p className="text-xs text-[#94a3b8] mt-1">Aucun véhicule. Cliquez sur &quot;Ajouter un véhicule&quot; ci-dessus.</p>
                )}
              </div>
            </section>

            {/* Priority Selection */}
            <section className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 md:p-8">
              <div className="flex items-center mb-8">
                <div className="h-10 w-10 rounded-xl bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b] mr-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">Priorité et planification</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { id: 'eco', name: 'Éco-Saver', desc: '2-3 Jours', co2: '-0.8kg CO2', active: true },
                  { id: 'std', name: 'Standard', desc: 'Le lendemain', co2: 'Neutre', active: false },
                  { id: 'rush', name: 'Express', desc: 'Aujourd\'hui', co2: '+1.2kg CO2', active: false, danger: true }
                ].map((item) => (
                  <div 
                    key={item.id}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      item.active 
                        ? 'border-[#13ec5b] bg-[#13ec5b]/5' 
                        : 'border-[#1e293b] bg-[#020617] hover:border-[#94a3b8]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-bold">{item.name}</span>
                      {item.active && <CheckCircle2 className="w-5 h-5 text-[#13ec5b]" />}
                    </div>
                    <p className="text-sm text-[#94a3b8]">{item.desc}</p>
                    <div className={`mt-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${item.danger ? 'text-[#ef4444]' : 'text-[#13ec5b]'}`}>
                      <Leaf className="w-3 h-3" /> {item.co2}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Date de livraison <span className="text-red-400">*</span></label>
                  <input 
                    type="date" 
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Heure de livraison <span className="text-red-400">*</span></label>
                  <select 
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]"
                  >
                    <option value="">Sélectionner une heure</option>
                    <option value="09:00-12:00">09:00 - 12:00</option>
                    <option value="12:00-15:00">12:00 - 15:00</option>
                    <option value="15:00-18:00">15:00 - 18:00</option>
                    <option value="ANYTIME">N'importe quand</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar / Estimate */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="sticky top-24 space-y-6">
              {/* Map Preview */}
              <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] overflow-hidden group">
                <div className="h-48 w-full bg-[#1e293b] relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent z-10 opacity-60" />
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="text-[10px] font-bold text-[#13ec5b] uppercase tracking-tighter">Aperçu de l'itinéraire</span>
                    <p className="text-sm font-medium flex items-center gap-2">
                      Entrepôt <ArrowRight className="w-3 h-3" /> Destination
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 z-20 bg-[#0f172a]/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-[#1e293b]">
                    14.2 km
                  </div>
                </div>
              </div>

              {/* Cost & Carbon Summary */}
              <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#13ec5b]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                
                <h3 className="text-lg font-bold mb-6">Estimation de livraison</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-[#020617] rounded-xl border border-[#1e293b]">
                    <span className="text-[10px] text-[#94a3b8] uppercase font-bold">Coût estimé</span>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-2xl font-black text-[#f8fafc] bg-transparent border-none outline-none w-full"
                        placeholder="0.00"
                      />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="text-xs bg-transparent border-none outline-none text-[#94a3b8]"
                      >
                        <option value="CFA">CFA</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 bg-[#13ec5b]/10 rounded-xl border border-[#13ec5b]/20">
                    <span className="text-[10px] text-[#13ec5b] uppercase font-bold">Carbone</span>
                    <p className="text-2xl font-black text-[#13ec5b] mt-1">0.45 kg</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { label: 'Service', value: 'Éco-Saver' },
                    { label: 'Poids', value: weight ? `${weight} kg` : '—' },
                    { label: 'Compensation', value: 'Incluse', highlight: true }
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-[#94a3b8]">{row.label}</span>
                      <span className={`font-semibold ${row.highlight ? 'text-[#13ec5b]' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Proof / Receipt Upload */}
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest">Preuve / Reçu</p>
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
                    className="w-full flex items-center justify-center gap-2 border border-[#1e293b] rounded-xl px-3 py-2 text-xs font-medium text-[#e5e7eb] bg-[#020617] hover:bg-[#0b1220] disabled:opacity-70 transition-colors"
                  >
                    <CloudUpload className="w-4 h-4" />
                    {uploadingProofs ? 'Upload en cours…' : 'Ajouter un reçu / preuve de livraison'}
                  </button>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {proofs.length === 0 ? (
                      <p className="text-[11px] text-[#64748b]">Aucun document attaché pour le moment.</p>
                    ) : (
                      proofs.map((p) => (
                        <div key={p.publicId} className="flex items-center justify-between gap-3 px-3 py-2 bg-[#020617] rounded-lg border border-[#1e293b]">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle className="w-4 h-4 text-[#13ec5b] shrink-0" />
                            <div className="min-w-0">
                              <a href={p.url} target="_blank" rel="noreferrer" className="block text-xs font-medium text-[#e5e7eb] truncate hover:underline">
                                {p.originalFilename}
                              </a>
                              <p className="text-[10px] text-[#64748b]">{Math.round(p.bytes / 1024)} Ko</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProofs((prev) => prev.filter((x) => x.publicId !== p.publicId))}
                            className="text-[#64748b] hover:text-[#f97373] transition-colors"
                            aria-label="Retirer le document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-[#13ec5b] text-[#020617] font-bold py-4 px-6 rounded-xl hover:bg-[#10b981] disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#13ec5b]/10 mt-6">
                  {submitting ? 'Création...' : 'Créer la livraison'} <ArrowRight className="w-5 h-5" />
                </button>
                <Link href="/dashboard/deliveries" className="block w-full mt-3 py-3 text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors text-center">
                  Annuler
                </Link>
              </div>

              {/* Info Box */}
              <div className="bg-[#6366f1]/10 rounded-2xl p-5 border border-[#6366f1]/20 flex gap-4">
                <AlertCircle className="w-5 h-5 text-[#6366f1] shrink-0" />
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  <span className="text-[#f8fafc] font-semibold">Routage optimisé actif :</span> Fluvex regroupe actuellement 3 autres livraisons dans cette zone.
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
