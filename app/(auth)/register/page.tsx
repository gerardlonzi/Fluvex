'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight, ArrowLeft, Rocket, Eye, EyeOff,
    AlertCircle, Mail, MapPin, CheckCircle2, Globe
} from 'lucide-react';

// Import pour le téléphone (nécessite npm install react-phone-number-input)
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function RegisterFlow() {
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

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
        phone: "",  // ← Correction ici : undefined au lieu de "650517700"
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });

    const STEPS_CONFIG = [
        { id: 1, label: "Entreprise & Localisation" },
        { id: 2, label: "Profil Professionnel" },
        { id: 3, label: "Sécurité du compte" },
    ];

    const handleChange = (e: any, manualId?: string) => {
        // Si manualId est présent, c'est un appel direct (comme pour le téléphone)
        if (manualId) {
            setFormData(prev => ({ ...prev, [manualId]: e }));
            if (errors[manualId]) {
                const newErrs = { ...errors };
                delete newErrs[manualId];
                setErrors(newErrs);
            }
            return;
        }

        // Sinon, c'est un événement standard
        const { id, value, type } = e.target;
        const val = type === 'checkbox' ? e.target.checked : value;

        setFormData(prev => ({ ...prev, [id]: val }));

        if (errors[id]) {
            const newErrs = { ...errors };
            delete newErrs[id];
            setErrors(newErrs);
        }
    };

    const validateStep = (s: number) => {
        const errs: Record<string, string> = {};
        if (s === 1) {
            if (!formData.companyName) errs.companyName = "Requis";
            if (!formData.email.includes('@')) errs.email = "Email invalide";
            if (!formData.address) errs.address = "Adresse requise";
            if (!formData.city) errs.city = "Ville requise";
        } else if (s === 2) {
            if (!formData.firstName) errs.firstName = "Requis";
            if (!formData.lastName) errs.lastName = "Requis";
            if (!formData.phone) errs.phone = "Numéro requis";
        } else if (s === 3) {
            if (formData.password.length < 8) errs.password = "8 caractères min.";
            if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Écart constaté";
            if (!formData.agreeTerms) errs.agreeTerms = "Requis";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) setStep(step + 1);
    };

    // Helper pour les labels stylés Login
    const InputLabel = ({ label, id, error }: { label: string, id: string, error?: string }) => (
        <div className="flex justify-between items-center mb-1.5">
            <label htmlFor={id} className="block text-sm font-semibold text-text-muted">{label}</label>
            {error && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-bounce"><AlertCircle size={12} /> {error}</span>}
        </div>
    );

    // Étape 4 : Écran de succès / Vérification Email
    if (step === 4) {
        return (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="text-primary w-10 h-10 animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold text-white">Vérifiez vos emails</h2>
                <p className="text-text-muted leading-relaxed">
                    Un lien de confirmation a été envoyé à <br />
                    <span className="text-white font-bold">{formData.email}</span>. <br />
                    Cliquez sur le lien pour activer votre espace Fluvex.
                </p>
                <div className="pt-4 space-y-3">
                    <button className="w-full bg-primary py-3 rounded-xl font-bold text-background hover:bg-primaryHover transition-all">
                        Ouvrir ma boîte mail
                    </button>
                    <button onClick={() => setStep(1)} className="text-sm text-text-muted hover:text-white underline underline-offset-4">
                        Utiliser une autre adresse
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* PROGRESS BAR FULL WIDTH */}
            <div className="mb-10 w-full space-y-4">
                <div className="flex justify-between w-full gap-2">
                    {STEPS_CONFIG.map((s) => (
                        <div key={s.id} className="flex-1 space-y-2">
                            <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${step >= s.id ? 'bg-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-800'}`} />
                            <p className={`text-[10px] font-bold uppercase tracking-tighter ${step >= s.id ? 'text-primary' : 'text-slate-600'}`}>
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight pt-2">
                    {STEPS_CONFIG.find(s => s.id === step)?.label}
                </h2>
            </div>

            <div className="space-y-5">
                {/* STEP 1: Entreprise & Localisation */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <InputLabel label="Nom de l'entreprise" id="companyName" error={errors.companyName} />
                            <input id="companyName" value={formData.companyName} onChange={handleChange} placeholder="ex: Fluvex Logistics" className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <InputLabel label="Email professionnel" id="email" error={errors.email} />
                            <input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@fluvex.com" className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all" />
                        </div>
                        <div>
                            <InputLabel label="Adresse du siège" id="address" error={errors.address} />
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 text-slate-500" size={16} />
                                <input id="address" value={formData.address} onChange={handleChange} placeholder="123 Rue de la Logistique" className="w-full bg-slate-900 border border-border rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-primary outline-none transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel label="Ville" id="city" error={errors.city} />
                                <input id="city" value={formData.city} onChange={handleChange} placeholder="Paris" className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <InputLabel label="Taille flotte" id="fleetSize" />
                                <select id="fleetSize" value={formData.fleetSize} onChange={handleChange} className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none">
                                    <option value="">Choisir...</option>
                                    <option value="1-10">1-10 véhicules</option>
                                    <option value="11-50">11-50 véhicules</option>
                                    <option value="51+">51+ véhicules</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Profil Professionnel */}
                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel label="Prénom" id="firstName" error={errors.firstName} />
                                <input id="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <InputLabel label="Nom" id="lastName" error={errors.lastName} />
                                <input id="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                        </div>
                        <div>
                            <InputLabel label="Téléphone mobile" id="phone" error={errors.phone} />
                            <div className="phone-input-container">
                                <PhoneInput
                                    international
                                    defaultCountry="FR"
                                    // On s'assure que la valeur est au moins une chaîne vide, jamais un objet
                                    value={formData.phone || ''}
                                    // On passe la valeur directement et on précise l'ID 'phone' en 2ème argument
                                    onChange={(val) => handleChange(val || '', 'phone')}
                                    className={`w-full bg-slate-900 border ${errors.phone ? 'border-red-500' : 'border-border'} rounded-lg p-3 text-white focus-within:ring-2 focus-within:ring-primary outline-none transition-all`}
                                />
                            </div>
                        </div>
                        <div>
                            <InputLabel label="Fonction" id="jobTitle" />
                            <input id="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="ex: Directeur des Opérations" className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                    </div>
                )}

                {/* STEP 3: Sécurité */}
                {step === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <InputLabel label="Mot de passe" id="password" error={errors.password} />
                            <div className="relative">
                                <input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500 hover:text-white">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <InputLabel label="Confirmer le mot de passe" id="confirmPassword" error={errors.confirmPassword} />
                            <input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer group pt-2">
                            <input type="checkbox" id="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} className="mt-1 accent-primary h-4 w-4" />
                            <span className="text-[11px] text-text-muted group-hover:text-white leading-relaxed">
                                En créant un compte, j'accepte les <strong>Conditions Générales</strong> et la <strong>Politique de Confidentialité</strong> de Fluvex.
                            </span>
                        </label>
                    </div>
                )}

                {/* NAVIGATION BUTTONS */}
                <div className="flex gap-4 pt-6">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} className="flex-1 bg-border text-text-main px-4 py-3 rounded-xl font-bold hover:bg-border/80 transition-all flex items-center justify-center">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <button
                        onClick={step === 3 ? () => handleNext() : handleNext}
                        className="flex-[3] bg-primary text-background px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {step === 3 ? "Finaliser l'inscription" : "Étape suivante"}
                        {step === 3 ? <Rocket size={18} /> : <ArrowRight size={18} />}
                    </button>
                </div>

                <p className="mt-8 text-center text-sm text-text-muted">
                    Vous avez déjà un compte ? <Link href="/login" className="text-primary hover:underline font-bold">Se connecter</Link>
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