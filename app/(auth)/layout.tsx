// src/app/(auth)/layout.tsx
import { Leaf } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      {/* Colonne Gauche : Branding / Visuel */}
      <div className="hidden lg:flex w-1/2 bg-surface relative items-center justify-center overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-[url(/authpicture.png)] bg-cover  "></div>
        
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