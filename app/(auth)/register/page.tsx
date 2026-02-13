'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Rocket,
  Eye,
  EyeOff,
  Mail,
  MapPin,
} from 'lucide-react';

// Import pour le téléphone (nécessite npm install react-phone-number-input)
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function RegisterFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    address: '',
    city: '',
    country: 'FR',
    fleetSize: '',
    industry: 'logistics',
    firstName: '',
    lastName: '',
    jobTitle: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const STEPS_CONFIG = [
    { id: 1, label: 'Entreprise & Localisation' },
    { id: 2, label: 'Profil Professionnel' },
    { id: 3, label: 'Sécurité du compte' },
  ];

  const handleChange = (e: any, manualId?: string) => {
    if (manualId) {
      setFormData((prev) => ({ ...prev, [manualId]: e }));
      if (errors[manualId]) {
        const newErrs = { ...errors };
        delete newErrs[manualId];
        setErrors(newErrs);
      }
      return;
    }

    const { id, value, type } = e.target;
    const val = type === 'checkbox' ? e.target.checked : value;

    setFormData((prev) => ({ ...prev, [id]: val }));

    if (errors[id]) {
      const newErrs = { ...errors };
      delete newErrs[id];
      setErrors(newErrs);
    }
  };

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.companyName) errs.companyName = 'Requis';
      if (!formData.email.includes('@')) errs.email = 'Email invalide';
      if (!formData.address) errs.address = 'Adresse requise';
      if (!formData.city) errs.city = 'Ville requise';
    } else if (s === 2) {
      if (!formData.firstName) errs.firstName = 'Requis';
      if (!formData.lastName) errs.lastName = 'Requis';
      if (!formData.phone) errs.phone = 'Numéro requis';
    } else if (s === 3) {
      if (formData.password.length < 8) errs.password = '8 caractères min.';
      if (formData.password !== formData.confirmPassword)
        errs.confirmPassword = 'Écart constaté';
      if (!formData.agreeTerms) errs.agreeTerms = 'Requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiError = data.error as string | undefined;
        setSubmitError(apiError || 'Erreur lors de la création du compte.');
        // Optionnel : mapper les erreurs Zod renvoyées côté API
        setSubmitting(false);
        return;
      }

      // L'API crée la session, on peut rediriger directement vers le dashboard
      router.push('/dashboard');
    } catch {
      setSubmitError('Erreur réseau, veuillez réessayer.');
      setSubmitting(false);
    }
  };

  const InputLabel = ({ label, id }: { label: string; id: string }) => (
    <label htmlFor={id} className="block text-sm font-semibold text-text-muted mb-1.5">
      {label}
    </label>
  );

  if (step === 4) {
    return (
      <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="text-primary w-10 h-10 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-white">Compte créé</h2>
        <p className="text-text-muted leading-relaxed">
          Votre compte a été créé avec succès.
          <br />
          Vous allez être redirigé vers votre tableau de bord.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-10 w-full space-y-4">
        <div className="flex justify-between w-full gap-2">
          {STEPS_CONFIG.map((s) => (
            <div key={s.id} className="flex-1 space-y-2">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                  step >= s.id
                    ? 'bg-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                    : 'bg-slate-800'
                }`}
              />
              <p
                className={`text-[10px] font-bold uppercase tracking-tighter ${
                  step >= s.id ? 'text-primary' : 'text-slate-600'
                }`}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight pt-2">
          {STEPS_CONFIG.find((s) => s.id === step)?.label}
        </h2>
      </div>

      <div className="space-y-5">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <InputLabel label="Nom de l'entreprise" id="companyName" />
              <input
                id="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="ex: Fluvex Logistics"
                className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${errors.companyName ? 'border-red-500' : 'border-border'}`}
              />
              {errors.companyName && <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>}
            </div>
            <div>
              <InputLabel label="Email professionnel" id="email" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@fluvex.com"
                className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all ${errors.email ? 'border-red-500' : 'border-border'}`}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <InputLabel label="Adresse du siège" id="address" />
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-slate-500" size={16} />
                <input
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Rue de la Logistique"
                  className={`w-full bg-slate-900 border rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-primary outline-none transition-all ${errors.address ? 'border-red-500' : 'border-border'}`}
                />
              </div>
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <InputLabel label="Ville" id="city" />
                <input
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Paris"
                  className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none ${errors.city ? 'border-red-500' : 'border-border'}`}
                />
                {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
              </div>
              <div>
                <InputLabel label="Taille flotte" id="fleetSize" />
                <select
                  id="fleetSize"
                  value={formData.fleetSize}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Choisir...</option>
                  <option value="1-10">1-10 véhicules</option>
                  <option value="11-50">11-50 véhicules</option>
                  <option value="51+">51+ véhicules</option>
                </select>
              </div>
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
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none ${errors.firstName ? 'border-red-500' : 'border-border'}`}
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <InputLabel label="Nom" id="lastName" />
                <input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none ${errors.lastName ? 'border-red-500' : 'border-border'}`}
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div>
              <InputLabel label="Téléphone mobile" id="phone" />
              <div className="phone-input-container">
                <PhoneInput
                  international
                  defaultCountry="FR"
                  value={formData.phone || ''}
                  onChange={(val) => handleChange(val || '', 'phone')}
                  className={`w-full bg-slate-900 border ${errors.phone ? 'border-red-500' : 'border-border'} rounded-lg p-3 text-white focus-within:ring-2 focus-within:ring-primary outline-none transition-all`}
                />
              </div>
              {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <InputLabel label="Fonction" id="jobTitle" />
              <input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="ex: Directeur des Opérations"
                className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <InputLabel label="Mot de passe" id="password" />
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none ${errors.password ? 'border-red-500' : 'border-border'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div>
              <InputLabel label="Confirmer le mot de passe" id="confirmPassword" />
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-border'}`}
              />
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>
            <label className="flex items-start gap-3 cursor-pointer group pt-2">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className={`mt-1 accent-primary h-4 w-4 ${errors.agreeTerms ? 'ring-2 ring-red-500 rounded' : ''}`}
              />
              <span className="text-[11px] text-text-muted group-hover:text-white leading-relaxed">
                En créant un compte, j'accepte les{' '}
                <strong>Conditions Générales</strong> et la{' '}
                <strong>Politique de Confidentialité</strong> de Fluvex.
              </span>
            </label>
            {errors.agreeTerms && <p className="text-sm text-red-500 mt-1">{errors.agreeTerms}</p>}
          </div>
        )}

        {submitError && (
          <p className="text-sm text-red-500 font-medium">{submitError}</p>
        )}

        <div className="flex gap-4 pt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-border text-text-main px-4 py-3 rounded-xl font-bold hover:bg-border/80 transition-all flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={step === 3 ? handleSubmit : handleNext}
            className="flex-[3] bg-primary text-background px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {step === 3
              ? submitting
                ? "Création du compte..."
                : "Finaliser l'inscription"
              : 'Étape suivante'}
            {step === 3 ? <Rocket size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="text-primary hover:underline font-bold">
            Se connecter
          </Link>
        </p>
      </div>

      <style jsx global>{`
        .PhoneInputInput {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          font-size: 0.875rem;
          margin-left: 10px;
        }
        .PhoneInputCountry {
          margin-right: 10px;
        }
        .phone-input-container .PhoneInput {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}