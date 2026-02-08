// src/app/(auth)/layout.tsx
import { Leaf } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      {/* Colonne Gauche : Branding / Visuel */}
      <div className="hidden lg:flex w-1/2 bg-surface relative items-center justify-center overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="text-white w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">FLUVEX</h1>
          </div>
          <p className="text-xl text-text-muted max-w-md leading-relaxed">
            La plateforme de logistique nouvelle génération. Optimisez vos flottes, réduisez votre empreinte carbone.
          </p>
        </div>
      </div>

      {/* Colonne Droite : Formulaire */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}