'use client';

import React, { useState } from 'react';
import { 
  Building2, BellRing, Blocks,Upload, Edit2, 
  Mail, Phone, Fingerprint, MapPin, ShieldCheck, 
  Key, Copy, Check, ShoppingBag, Cloud, Truck, Search, Bell, MessageSquare
} from 'lucide-react';

export default function SettingsPage() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // État du formulaire
  const [companyData, setCompanyData] = useState({
    name: "EcoLogistics Solutions Inc.",
    email: "admin@ecologistics.com",
    phone: "+1 (555) 123-4567",
    taxId: "US-987654321",
    address: "123 Green Supply Chain Blvd, Suite 400\nSan Francisco, CA 94107"
  });

  // État des notifications
  const [notifs, setNotifs] = useState({
    shipments: true,
    fleet: true,
    billing: false
  });

  // --- ACTIONS ---
  const handleCopyKey = () => {
    navigator.clipboard.writeText("pk_live_51Mz...q3tZ8x9");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    // Ici, tu ajouterais ton appel API
  };

  return (
    <div className="flex-1 bg-background text-text-main min-h-screen">
      {/* HEADER LOCAL (Si pas déjà dans le layout) */}
     

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Configuration</h2>
          <p className="text-text-muted">Gérez le profil de votre entreprise, les notifications et vos intégrations API.</p>
        </div>

        {/* NAVIGATION TABS FONCTIONNELLE */}
        <div className="flex gap-8 border-b border-border mb-10 overflow-x-auto">
          <TabButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')}
            icon={<Building2 size={18} />} 
            label="Profil Entreprise" 
          />
          <TabButton 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')}
            icon={<BellRing size={18} />} 
            label="Notifications" 
          />
          <TabButton 
            active={activeTab === 'integrations'} 
            onClick={() => setActiveTab('integrations')}
            icon={<Blocks size={18} />} 
            label="API & Intégrations" 
          />
        </div>

        {/* CONTENU DYNAMIQUE */}
        <div className="space-y-12">
          
          {/* SECTION 1 : PROFIL */}
          {activeTab === 'profile' && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Détails de l'entreprise</h3>
                <button 
                  onClick={handleSave}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 ${
                    isSaved ? 'bg-primary text-background' : 'bg-primary text-background hover:bg-primaryHover shadow-primary/10'
                  }`}
                >
                  {isSaved ? <Check size={18} /> : null}
                  {isSaved ? 'Enregistré !' : 'Sauvegarder'}
                </button>
              </div>

              <div className="bg-surface rounded-2xl border border-border p-8 shadow-xl">
                {/* Logo Upload Simulation */}
                <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/5">
                  <div className="relative group cursor-pointer">
                    <div className="size-24 rounded-2xl bg-border border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-colors group-hover:border-primary">
                      <img src="https://i.pravatar.cc/150?u=company" className="w-full h-full object-cover" alt="Logo" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={24} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Logo de l'entreprise</h4>
                    <p className="text-sm text-text-muted">PNG ou JPG. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="Nom de l'entreprise" 
                    icon={<Building2 size={16}/>} 
                    value={companyData.name} 
                    onChange={(val) => setCompanyData({...companyData, name: val})}
                  />
                  <InputField 
                    label="Email Business" 
                    icon={<Mail size={16}/>} 
                    value={companyData.email} 
                    onChange={(val) => setCompanyData({...companyData, email: val})}
                  />
                  <InputField 
                    label="Téléphone" 
                    icon={<Phone size={16}/>} 
                    value={companyData.phone} 
                  />
                  <InputField 
                    label="N° TVA / Tax ID" 
                    icon={<Fingerprint size={16}/>} 
                    value={companyData.taxId} 
                  />
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase ml-1">Adresse du Siège</label>
                    <textarea 
                      className="w-full bg-border border border-border rounded-xl p-4 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all h-32"
                      value={companyData.address}
                      onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2 : NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold mb-6">Préférences de notification</h3>
              <div className="bg-[#0F172A] rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                <ToggleItem 
                  title="Mises à jour des livraisons" 
                  desc="Notifications en temps réel sur le statut des colis."
                  checked={notifs.shipments}
                  onChange={() => setNotifs({...notifs, shipments: !notifs.shipments})}
                  icon={<Truck className="text-blue-400" />}
                />
                <ToggleItem 
                  title="Alertes de Flotte" 
                  desc="Maintenance des véhicules et déviations de trajectoire."
                  checked={notifs.fleet}
                  onChange={() => setNotifs({...notifs, fleet: !notifs.fleet})}
                  icon={<ShieldCheck className="text-emerald-400" />}
                />
                <ToggleItem 
                  title="Facturation" 
                  desc="Récapitulatifs hebdomadaires et nouvelles factures."
                  checked={notifs.billing}
                  onChange={() => setNotifs({...notifs, billing: !notifs.billing})}
                  icon={<Key className="text-purple-400" />}
                />
              </div>
            </section>
          )}

          {/* SECTION 3 : INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {/* API KEY BOX */}
              <div className="bg-gradient-to-br from-border to-background rounded-2xl p-8 border border-border relative overflow-hidden group">
                 <div className="relative z-10">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-primary">
                      <Key size={18} /> Clé API de Production
                    </h4>
                    <p className="text-sm text-text-muted mb-6">Utilisez cette clé pour authentifier vos requêtes. Ne la partagez jamais.</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-background/40 border border-border rounded-xl p-3 font-mono text-sm text-primary/80 truncate">
                        pk_live_51Mz...q3tZ8x9
                      </div>
                      <button 
                        onClick={handleCopyKey}
                        className="bg-border/50 hover:bg-border px-5 rounded-xl transition-all flex items-center gap-2 font-bold text-sm text-text-main"
                      >
                        {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                        {copied ? 'Copié' : 'Copier'}
                      </button>
                    </div>
                 </div>
              </div>

              {/* INTEGRATIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <IntegrationCard name="Shopify" desc="Synchronisez vos commandes automatiquement." status="Connecté" icon={<ShoppingBag className="text-[#95BF47]"/>} />
                <IntegrationCard name="SAP ERP" desc="Gestion avancée des ressources et de la flotte." icon={<Cloud className="text-blue-400"/>} />
                <IntegrationCard name="Salesforce" desc="Insights clients et suivi des livraisons." icon={<Building2 className="text-sky-500"/>} />
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}

// --- SOUS-COMPOSANTS UTILES ---

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
        active ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InputField({ label, icon, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-text-muted uppercase ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">{icon}</div>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-border border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
        />
      </div>
    </div>
  );
}

function ToggleItem({ title, desc, checked, onChange, icon }: any) {
  return (
    <div className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-4">
        <div className="size-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-text-main">{title}</h4>
          <p className="text-sm text-slate-500 max-w-sm">{desc}</p>
        </div>
      </div>
      <button 
        onClick={onChange}
        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${checked ? 'bg-primary' : 'bg-border'}`}
      >
        <div className={`absolute top-1 size-4 rounded-full bg-white transition-all duration-300 ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}

function IntegrationCard({ name, desc, status, icon }: any) {
  return (
    <div className="bg-surface border border-border p-6 rounded-2xl hover:shadow-xl hover:border-primary/30 transition-all flex flex-col items-start group">
      <div className="size-12 rounded-xl bg-border border border-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-bold text-lg mb-1">{name}</h4>
      <p className="text-xs text-text-muted leading-relaxed mb-6">{desc}</p>
      <div className="mt-auto w-full">
        {status === 'Connecté' ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">Connecté</span>
            <button className="text-text-muted hover:text-text-main transition-colors"><Edit2 size={14}/></button>
          </div>
        ) : (
          <button className="w-full py-2 bg-border border border-border rounded-lg text-xs font-bold text-text-main hover:bg-border/80 transition-all">Connecter</button>
        )}
      </div>
    </div>
  );
}