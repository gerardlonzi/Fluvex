'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: '', password: ''});


  return (
    <div>
      

      <h2 className="text-3xl font-bold text-white mb-2">Se connecter</h2>
      <p className="text-text-muted mb-8">Ravis de vous revoir.</p>

      <div className="space-y-4">
        
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Email professionnel</label>
              <input type="email" placeholder="nom@entreprise.com" className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Mot de passe</label>
              <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
            </div>
          </div>
      </div>
      <button  className="flex-1 bg-primary hover:bg-primaryHover w-full mt-5 text-background px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              Continuer <ArrowRight className="w-4 h-4" />
            </button>

      <p className="mt-8 text-center text-sm text-text-muted">
        Pas encore de compte ? <Link href="/register    " className="text-primary hover:underline">Créer un compte</Link>
      </p>
    </div>
  );
}