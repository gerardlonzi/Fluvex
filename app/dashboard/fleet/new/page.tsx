'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Save, 
  User, 
  Camera, 
  Pencil, 
  IdCard, 
  Briefcase, 
  Truck, 
  ChevronDown, 
  Car, 
  FolderOpen, 
  CloudUpload, 
  CheckCircle, 
  Trash2 
} from 'lucide-react';

// Note: Assurez-vous que les polices (Geist Sans) sont chargées dans votre layout.tsx

export default function NewDriverPage() {
  return (
    <div className="bg-slate-50 dark:bg-background text-slate-800 dark:text-text-main min-h-screen font-sans antialiased transition-colors duration-200">
      
      <main className="max-w-5xl mx-auto py-8">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-text-main tracking-tight">Ajouter un nouveau chauffeur</h1>
              <p className="text-slate-500 dark:text-text-muted mt-1">Intégrez un nouveau chauffeur, assignez des véhicules et gérez la conformité.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard/fleet" 
                className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-border font-semibold text-slate-600 dark:text-text-muted hover:bg-slate-50 dark:hover:bg-surface hover:text-slate-900 dark:hover:text-text-main transition-colors"
              >
                Annuler
              </Link>
              <button className="px-6 py-2.5 rounded-lg bg-primary text-background font-bold hover:bg-primaryHover transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                <Save className="w-4 h-4" />
                Enregistrer le chauffeur
              </button>
            </div>
          </div>
        </header>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Personal Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Personal Information Card */}
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informations personnelles
                  </h2>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">Requis</span>
                </div>
                <div className="flex flex-col md:flex-row gap-8 mb-6">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-24 h-24 group cursor-pointer">
                      <div className="w-full h-full rounded-full bg-slate-50 dark:bg-background overflow-hidden border-2 border-dashed border-slate-300 dark:border-border flex items-center justify-center group-hover:border-primary transition-colors">
                        <Camera className="w-8 h-8 text-slate-400 dark:text-text-muted group-hover:text-primary" />
                      </div>
                      <div className="absolute bottom-0 right-0 bg-primary text-background rounded-full p-1.5 border-2 border-white dark:border-surface">
                        <Pencil className="w-3 h-3 block" />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-text-muted">Photo de profil</span>
                  </div>
                  {/* Inputs Grid */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Nom légal complet</label>
                      <input className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="ex. Jonathan Doe" type="text" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Date de naissance</label>
                      <input className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" type="date" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Adresse e-mail</label>
                      <input className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="john@eco-sync.com" type="email" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Numéro de téléphone</label>
                      <input className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="+1 (555) 000-0000" type="tel" />
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 dark:border-border grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Numéro de permis</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IdCard className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                      </span>
                      <input className="w-full pl-9 bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono" placeholder="DL-12345678" type="text" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Expiration du permis</label>
                    <input className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" type="date" />
                  </div>
                </div>
              </section>

              {/* Work Preferences */}
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Préférences de travail
                  </h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-3">Régions d'intervention</label>
                    <div className="flex flex-wrap gap-2">
                      {['Centre-ville Nord', 'Zone industrielle Ouest', 'Métro Sud', 'Zone Aéroport'].map((region, i) => (
                        <label key={region} className="cursor-pointer group">
                          <input defaultChecked={i % 2 === 0} className="peer sr-only" type="checkbox" />
                          <span className="px-4 py-2 rounded-full border border-slate-200 dark:border-border bg-slate-50 dark:bg-background text-sm text-slate-600 dark:text-text-muted peer-checked:bg-primary peer-checked:text-background peer-checked:border-primary peer-checked:font-semibold transition-all select-none hover:border-primary/50">
                            {region}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Quart de travail principal</label>
                      <select className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer">
                        <option>Matin (06:00 - 14:00)</option>
                        <option>Après-midi (14:00 - 22:00)</option>
                        <option>Nuit (22:00 - 06:00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Type d'emploi</label>
                      <select className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer">
                        <option>Temps plein</option>
                        <option>Temps partiel</option>
                        <option>Prestataire</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Vehicle & Documents */}
            <div className="space-y-6">
              
              {/* Vehicle Assignment */}
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Assignation de véhicule
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-text-muted mb-1.5">Sélectionner un véhicule</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-4 py-2.5 text-slate-900 dark:text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer">
                        <option disabled defaultValue="" >Rechercher ou sélectionner...</option>
                        <option value="v1">Tesla Model Y (EV) - #FLEET-042</option>
                        <option value="v2">Ford E-Transit (EV) - #FLEET-089</option>
                        <option value="v3">Rivian R1T (EV) - #FLEET-101</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                      </span>
                    </div>
                  </div>
                  {/* Selected Vehicle Detail Preview */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-background border border-slate-200 dark:border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-white dark:bg-surface flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-border">
                        <Car className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-text-main">Tesla Model Y</h4>
                        <p className="text-xs text-slate-500 dark:text-text-muted">#FLEET-042</p>
                        <div className="mt-2 flex gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            Électrique
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-border text-slate-800 dark:text-text-muted">
                            Disponible
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Document Upload */}
              <section className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-text-main flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    Docs de conformité
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-text-muted mb-4">Veuillez télécharger des PDF ou JPG valides. Taille max 5 Mo.</p>
                <div className="space-y-4">
                  {/* Drag & Drop Zone */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-border rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-background hover:border-primary transition-colors cursor-pointer group">
                    <CloudUpload className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-text-muted">Cliquez pour télécharger ou glissez-déposez</p>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Permis, Assurance, Identité</p>
                  </div>
                  {/* File List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-background rounded-lg border border-slate-200 dark:border-border">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-text-main">Permis_Recto.jpg</p>
                          <p className="text-xs text-slate-500 dark:text-text-muted">2.4 Mo</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-danger transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}