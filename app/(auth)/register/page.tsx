'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/src/components/ui/toast';
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
  Loader2,
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { registerFormSchema, type RegisterFormInput } from '@/lib/validations/auth';
import type { PlaceResult } from '@/utils/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function getCountryCode(context: Array<{ id: string; short_code: string }> | undefined): string {
  if (!context) return 'FR';
  const country = context.find((item) => item.id.startsWith('country'));
  return country?.short_code ? country.short_code.toUpperCase() : 'FR';
}

export default function RegisterFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [addressCompanySuggestions, setAddressCompanySuggestions] = useState<PlaceResult[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const { showError, showSuccess } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema) as Resolver<RegisterFormInput>,
    defaultValues: {
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
    },
  });

  const addressValue = watch('address');

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
              setValue('address', feature.place_name);
              setValue('country', getCountryCode(feature.context));
              setAddressCompanySuggestions([]);
            }
          } catch (error) {
            console.error('Erreur GPS:', error);
          } finally {
            setIsLocating(false);
          }
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!MAPBOX_TOKEN || !addressValue?.trim() || addressValue.length < 3 || isLocating) {
      setAddressCompanySuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressValue)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=fr&types=neighborhood,address,place,locality,poi`
      )
        .then((r) => r.json())
        .then((data) => {
          const list = (data?.features ?? []).map((f: { id: string; place_name: string; center: [number, number]; context?: Array<{ id: string; short_code: string }> }) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
            context: f.context,
          }));
          setAddressCompanySuggestions(list);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [addressValue, isLocating]);

  const STEP_1_FIELDS = ['companyName', 'email', 'address', 'fleetSize'] as const;
  const STEP_2_FIELDS = ['firstName', 'lastName', 'phone'] as const;
  const STEP_3_FIELDS = ['password', 'confirmPassword', 'agreeTerms'] as const;

  const handleNext = async () => {
    const fields = step === 1 ? STEP_1_FIELDS : step === 2 ? STEP_2_FIELDS : STEP_3_FIELDS;
    const valid = await trigger([...fields]);
    if (valid) setStep(step + 1);
  };

  const onSubmit = async (data: RegisterFormInput) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(responseData.error || 'Erreur lors de la création du compte.');
        return;
      }
      showSuccess('Compte créé avec succès !');
      router.push('/dashboard');
    } catch {
      showError('Erreur réseau, veuillez réessayer.');
    }
  };

  const InputLabel = ({ label, id }: { label: string; id: string }) => (
    <label htmlFor={id} className="block text-sm font-semibold text-text-muted mb-1.5">
      {label}
    </label>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-md mx-auto p-4 font-sans bg-background">
      <div className="mb-10 w-full space-y-4">
        <div className="flex justify-between w-full gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex-1 space-y-2">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-500 ${step >= num ? 'bg-primary' : 'bg-border'}`}
              />
              <p
                className={`text-[10px] font-bold uppercase ${step >= num ? 'text-primary' : 'text-text-muted'}`}
              >
                {num === 1 ? 'Entreprise' : num === 2 ? 'Profil' : 'Sécurité'}
              </p>
            </div>
          ))}
        </div>
        <h2 className="text-3xl font-black text-text-main tracking-tight pt-2">
          {step === 1 ? 'Infos Entreprise' : step === 2 ? 'Profil Professionnel' : 'Sécurité du compte'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <InputLabel label="Nom de l'entreprise" id="companyName" />
              <input
                id="companyName"
                {...register('companyName')}
                placeholder="ex: Fluvex Logistics"
                className={`w-full bg-surface border ${errors.companyName ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}
              />
              {errors.companyName && <p className="text-xs text-danger mt-1">{errors.companyName.message}</p>}
            </div>
            <div>
              <InputLabel label="Email professionnel" id="email" />
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contact@fluvex.com"
                className={`w-full bg-surface border ${errors.email ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}
              />
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </div>
            <div className="relative">
              <InputLabel label="Adresse du siège" id="address" />
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  {...register('address')}
                  className={`w-full bg-surface border ${errors.address ? 'border-danger' : 'border-border'} rounded-xl text-text-main pl-10 pr-12 p-3 focus:ring-2 focus:ring-primary outline-none transition-all`}
                  placeholder="Quartier, ville..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleGeolocate}
                  disabled={isLocating}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
                >
                  {isLocating ? <Loader2 className="animate-spin w-5 h-5" /> : <Locate className="w-5 h-5" />}
                </button>
              </div>
              {addressCompanySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-xl z-50 overflow-hidden">
                  {addressCompanySuggestions.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm text-text-main hover:bg-border transition-colors"
                      onClick={() => {
                        setValue('address', r.place_name);
                        setValue('country', getCountryCode(r.context ?? []));
                        setAddressCompanySuggestions([]);
                      }}
                    >
                      {r.place_name}
                    </button>
                  ))}
                </div>
              )}
              {errors.address && <p className="text-xs text-danger mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <InputLabel label="Taille flotte" id="fleetSize" />
              <select
                id="fleetSize"
                {...register('fleetSize')}
                className={`w-full bg-surface border ${errors.fleetSize ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}
              >
                <option value="">Choisir...</option>
                <option value="1-10">1-10 véhicules</option>
                <option value="11-50">11-50 véhicules</option>
                <option value="51+">51+ véhicules</option>
              </select>
              {errors.fleetSize && <p className="text-xs text-danger mt-1">{errors.fleetSize.message}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <InputLabel label="Prénom" id="firstName" />
                <input
                  id="firstName"
                  {...register('firstName')}
                  className={`w-full bg-surface border ${errors.firstName ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}
                />
                {errors.firstName && <p className="text-xs text-danger mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <InputLabel label="Nom" id="lastName" />
                <input
                  id="lastName"
                  {...register('lastName')}
                  className={`w-full bg-surface border ${errors.lastName ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}
                />
                {errors.lastName && <p className="text-xs text-danger mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <InputLabel label="Téléphone mobile" id="phone" />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <div
                    className={`phone-input-custom border ${errors.phone ? 'border-danger' : 'border-border'} rounded-lg bg-surface`}
                  >
                    <PhoneInput
                      international
                      defaultCountry={(watch('country') as 'FR') || 'FR'}
                      value={field.value}
                      onChange={(val) => field.onChange(val || '')}
                      className="w-full p-3 text-text-main"
                    />
                  </div>
                )}
              />
              {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <InputLabel label="Mot de passe" id="password" />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  {...register('password')}
                  className={`w-full bg-surface border ${errors.password ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-text-muted"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <InputLabel label="Confirmer" id="confirmPassword" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                {...register('confirmPassword')}
                className={`w-full bg-surface border ${errors.confirmPassword ? 'border-danger' : 'border-border'} rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none`}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
            <label className="flex gap-3 items-start cursor-pointer">
              <input
                type="checkbox"
                {...register('agreeTerms')}
                className="mt-1 accent-primary"
              />
              <span className="text-sm text-text-muted">J&apos;accepte les conditions d&apos;utilisation.</span>
            </label>
            {errors.agreeTerms && <p className="text-xs text-danger mt-1">{errors.agreeTerms.message}</p>}
          </div>
        )}

        <div className="flex gap-4 pt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-surface border border-border text-text-main px-4 py-3 rounded-xl font-bold hover:bg-border flex justify-center transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            type={step === 3 ? 'submit' : 'button'}
            disabled={isSubmitting}
            onClick={step !== 3 ? handleNext : undefined}
            className="flex-[3] bg-primary text-slate-950 px-6 py-4 rounded-xl font-bold flex justify-center gap-2 items-center hover:bg-primaryHover transition-all disabled:opacity-50"
          >
            {step === 3 ? (isSubmitting ? 'Création...' : 'Finaliser') : 'Suivant'}
            {step === 3 ? <Rocket size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-text-muted">
        Vous avez déjà un compte ?{' '}
        <Link href="/login" className="text-primary hover:underline font-bold">
          Se connecter
        </Link>
      </p>

      <style jsx global>{`
        .PhoneInputInput {
          background: transparent;
          border: none;
          color: var(--text-main);
          outline: none;
          width: 100%;
        }
        .PhoneInputCountry {
          margin-left: 10px;
          margin-right: 10px;
        }
      `}</style>
    </div>
  );
}
