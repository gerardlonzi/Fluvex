'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/src/components/ui/toast'; // Vérifie que le chemin est correct
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Rocket,
  Eye,
  EyeOff,
  MapPin,
  Locate,
  Loader2
} from 'lucide-react';

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

type PlaceResult = { 
  id: string; 
  place_name: string; 
  center: [number, number];
  context?: Array<{ id: string; short_code: string }>;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function RegisterFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useToast();
  
  const [addressCompanySuggestions, setAddressCompanySuggestions] = useState<PlaceResult[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [CompanyAddress, setCompanyAddress] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    address: '',
    country: 'FR', 
    fleetSize: '',
    industry: 'logistics',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const getCountryCode = (context: any[] | undefined) => {
    if (!context) return 'FR';
    const country = context.find((item: any) => item.id.startsWith('country'));
    return country?.short_code ? country.short_code.toUpperCase() : 'FR';
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      showError("La géolocalisation n'est pas supportée.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (MAPBOX_TOKEN) {
          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=neighborhood,address,poi,place`
            );
            const data = await res.json();
            const feature = data?.features?.[0];
            if (feature) {
              setCompanyAddress(feature.place_name);
              setFormData(prev => ({
                ...prev,
                address: feature.place_name,
                country: getCountryCode(feature.context)
              }));
              setAddressCompanySuggestions([]);
            }
          } catch (error) {
            console.error("Erreur GPS:", error);
          } finally {
            setIsLocating(false);
          }
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handleChange = (e: any, manualId?: string) => {
    if (manualId) {
      setFormData((prev) => ({ ...prev, [manualId]: e }));
      // Nettoyer l'erreur quand l'utilisateur tape
      if (errors[manualId]) setErrors(prev => { const n = {...prev}; delete n[manualId]; return n; });
      return;
    }
    const { id, value, type } = e.target;
    const val = type === 'checkbox' ? e.target.checked : value;
    setFormData((prev) => ({ ...prev, [id]: val }));
    if (errors[id]) setErrors(prev => { const n = {...prev}; delete n[id]; return n; });
  };
  
  useEffect(() => {
    if (!MAPBOX_TOKEN || !CompanyAddress.trim() || CompanyAddress.length < 3 || isLocating) {
      setAddressCompanySuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(CompanyAddress)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=fr&types=neighborhood,address,place,locality,poi`)
        .then((r) => r.json())
        .then((data) => {
            const list = (data?.features ?? []).map((f: any) => ({ 
                id: f.id, 
                place_name: f.place_name, 
                center: f.center,
                context: f.context 
            }));
            setAddressCompanySuggestions(list);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [CompanyAddress, isLocating]);

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.companyName) errs.companyName = "Nom de l'entreprise requis";
      if (!formData.email) errs.email = "Email requis";
      else if (!formData.email.includes('@')) errs.email = "Email invalide";
      if (!formData.address) errs.address = "Adresse requise";
      if (!formData.fleetSize) errs.fleetSize = "Taille de flotte requise";
    } else if (s === 2) {
      if (!formData.firstName) errs.firstName = "Prénom requis";
      if (!formData.lastName) errs.lastName = "Nom requis";
      if (!formData.phone) errs.phone = "Numéro de téléphone requis";
    } else if (s === 3) {
      if (!formData.password) errs.password = "Mot de passe requis";
      else if (formData.password.length < 8) errs.password = "8 caractères minimum";
      if (!formData.confirmPassword) errs.confirmPassword = "Confirmation requise";
      else if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Les mots de passe ne correspondent pas";
      if (!formData.agreeTerms) errs.agreeTerms = "Vous devez accepter les conditions";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) setStep(step + 1); };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(data.error || 'Erreur lors de la création du compte.');
        setSubmitting(false);
        return;
      }
      showSuccess('Compte créé avec succès !');
      router.push('/dashboard');
    } catch {
      showError('Erreur réseau, veuillez réessayer.');
      setSubmitting(false);
    }
  };  

  const InputLabel = ({ label, id }: { label: string; id: string }) => (
    <label htmlFor={id} className="block text-sm font-semibold text-text-muted mb-1.5">{label}</label>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-md mx-auto p-4 font-sans bg-background">
      {/* Stepper */}
      <div className="mb-10 w-full space-y-4">
        <div className="flex justify-between w-full gap-2">
            {[1, 2, 3].map((num) => (
                <div key={num} className="flex-1 space-y-2">
                    <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${step >= num ? 'bg-primary' : 'bg-border'}`} />
                    <p className={`text-[10px] font-bold uppercase ${step >= num ? 'text-primary' : 'text-text-muted'}`}>
                      {num === 1 ? 'Entreprise' : num === 2 ? 'Profil' : 'Sécurité'}
                    </p>
                </div>
            ))}
        </div>
        <h2 className="text-3xl font-black text-text-main tracking-tight pt-2">
          {step === 1 ? 'Infos Entreprise' : step === 2 ? 'Profil Professionnel' : 'Sécurité du compte'}
        </h2>
      </div>

      <div className="space-y-5">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <InputLabel label="Nom de l'entreprise" id="companyName" />
              <input id="companyName" value={formData.companyName} onChange={handleChange} placeholder="ex: Fluvex Logistics" 
                className={`w-full bg-surface border ${errors.companyName ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`} />
              {errors.companyName && <p className="text-xs text-danger mt-1">{errors.companyName}</p>}
            </div>
            
            <div>
              <InputLabel label="Email professionnel" id="email" />
              <input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@fluvex.com" 
                className={`w-full bg-surface border ${errors.email ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`} />
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email}</p>}
            </div>

            <div className="relative">
              <InputLabel label="Adresse du siège" id="address" />
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input type="text" value={CompanyAddress} 
                  onChange={(e) => { setCompanyAddress(e.target.value); handleChange(e.target.value, 'address'); }}
                  className={`w-full bg-surface border ${errors.address ? 'border-danger' : 'border-border'} rounded-xl text-text-main pl-10 pr-12 p-3 focus:ring-2 focus:ring-primary outline-none transition-all`} 
                  placeholder="Quartier, ville..." autoComplete="off" />
                <button type="button" onClick={handleGeolocate} disabled={isLocating} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                    {isLocating ? <Loader2 className="animate-spin w-5 h-5" /> : <Locate className="w-5 h-5" />}
                </button>
              </div>
              {addressCompanySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-xl z-50 overflow-hidden">
                  {addressCompanySuggestions.map((r) => (
                    <button key={r.id} type="button" className="w-full text-left px-4 py-3 text-sm text-text-main hover:bg-border transition-colors"
                      onClick={() => {
                        setCompanyAddress(r.place_name); 
                        setFormData(prev => ({ ...prev, address: r.place_name, country: getCountryCode(r.context) }));
                        setAddressCompanySuggestions([]);
                      }}>{r.place_name}</button>
                  ))}
                </div>
              )}
              {errors.address && <p className="text-xs text-danger mt-1">{errors.address}</p>}
            </div>

            <div>
               <InputLabel label="Taille flotte" id="fleetSize" />
               <select id="fleetSize" value={formData.fleetSize} onChange={handleChange} 
                className={`w-full bg-surface border ${errors.fleetSize ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}>
                  <option value="">Choisir...</option>
                  <option value="1-10">1-10 véhicules</option>
                  <option value="11-50">11-50 véhicules</option>
                  <option value="51+">51+ véhicules</option>
               </select>
               {errors.fleetSize && <p className="text-xs text-danger mt-1">{errors.fleetSize}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <InputLabel label="Prénom" id="firstName"/>
                      <input id="firstName" value={formData.firstName} onChange={handleChange} 
                        className={`w-full bg-surface border ${errors.firstName ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}/>
                      {errors.firstName && <p className="text-xs text-danger mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <InputLabel label="Nom" id="lastName"/>
                      <input id="lastName" value={formData.lastName} onChange={handleChange} 
                        className={`w-full bg-surface border ${errors.lastName ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}/>
                      {errors.lastName && <p className="text-xs text-danger mt-1">{errors.lastName}</p>}
                    </div>
                </div>
                <div>
                    <InputLabel label="Téléphone mobile" id="phone" />
                    <div className={`phone-input-custom border ${errors.phone ? 'border-danger' : 'border-border'} rounded-lg bg-surface`}>
                        <PhoneInput international defaultCountry={(formData.country as any) || "FR"} value={formData.phone} 
                            onChange={(val) => handleChange(val || '', 'phone')} className="w-full p-3 text-text-main" />
                    </div>
                    {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone}</p>}
                </div>
            </div>
        )}
        
        {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <InputLabel label="Mot de passe" id="password"/>
                  <div className="relative">
                    <input type={showPassword ? 'text':'password'} id="password" value={formData.password} onChange={handleChange} 
                      className={`w-full bg-surface border ${errors.password ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}/>
                    <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-3 text-text-muted">
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-danger mt-1">{errors.password}</p>}
                </div>

                <div>
                  <InputLabel label="Confirmer" id="confirmPassword"/>
                  <input type={showPassword ? 'text' : 'password'} id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} 
                    className={`w-full bg-surface border ${errors.confirmPassword ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}/>
                  {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword}</p>}
                </div>
               
                <label className="flex gap-3 items-start cursor-pointer">
                  <input type="checkbox" id="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} className="mt-1 accent-primary"/>
                  <span className="text-sm text-text-muted">J&apos;accepte les conditions d&apos;utilisation.</span>
                </label>
                {errors.agreeTerms && <p className="text-xs text-danger mt-1">{errors.agreeTerms}</p>}
            </div>
        )}

        <div className="flex gap-4 pt-6">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="flex-1 bg-surface border border-border text-text-main px-4 py-3 rounded-xl font-bold hover:bg-border flex justify-center transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <button type="button" disabled={submitting} onClick={step === 3 ? handleSubmit : handleNext} 
            className="flex-[3] bg-primary text-slate-950 px-6 py-4 rounded-xl font-bold flex justify-center gap-2 items-center hover:bg-primaryHover transition-all disabled:opacity-50">
            {step === 3 ? (submitting ? "Création..." : "Finaliser") : 'Suivant'}
            {step === 3 ? <Rocket size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-text-muted">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="text-primary hover:underline font-bold">Se connecter</Link>
      </p>

      <style jsx global>{`
        .PhoneInputInput { background: transparent; border: none; color: var(--text-main); outline: none; width: 100%; }
        .PhoneInputCountry { margin-left: 10px; margin-right: 10px; }
      `}</style>
    </div>
  );
}