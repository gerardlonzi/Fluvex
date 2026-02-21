'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/src/components/ui/toast';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();
  const { showError } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email.trim(), password: data.password }),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (responseData.error?.email) setError('email', { message: responseData.error.email });
        if (responseData.error?.password) setError('password', { message: responseData.error.password });
        return;
      }
      router.push((responseData.redirect as string) || '/dashboard');
    } catch {
      showError('Erreur réseau, veuillez réessayer.');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Se connecter</h2>
      <p className="text-text-muted mb-8">Ravis de vous revoir.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Email professionnel
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="nom@entreprise.com"
              className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${errors.email ? 'border-red-500' : 'border-border'}`}
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${errors.password ? 'border-red-500' : 'border-border'}`}
            />
            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary hover:bg-primaryHover disabled:opacity-70 disabled:cursor-not-allowed w-full mt-3 text-background px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Connexion...' : 'Continuer'}
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
