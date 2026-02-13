'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const err: { email?: string; password?: string } = {};
    if (!email.trim()) err.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = 'Adresse email invalide.';
    if (!password) err.password = 'Le mot de passe est requis.';
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Email ou mot de passe incorrect.');
        setLoading(false);
        return;
      }
      router.push((data.redirect as string) || '/dashboard');
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Se connecter</h2>
      <p className="text-text-muted mb-8">Ravis de vous revoir.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Email professionnel
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined })); }}
              placeholder="nom@entreprise.com"
              className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${fieldErrors.email ? 'border-red-500' : 'border-border'}`}
            />
            {fieldErrors.email && <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="••••••••"
              className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${fieldErrors.password ? 'border-red-500' : 'border-border'}`}
            />
            {fieldErrors.password && <p className="text-sm text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium mt-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primaryHover disabled:opacity-70 disabled:cursor-not-allowed w-full mt-3 text-background px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Connexion...' : 'Continuer'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-text-muted">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}