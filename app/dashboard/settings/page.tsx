'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  BellRing,
  Blocks,
  Upload,
  Edit2,
  Mail,
  Phone,
  Fingerprint,
  ShieldCheck,
  Key,
  Copy,
  Check,
  ShoppingBag,
  Cloud,
  Truck,
  Sun,
  Moon,
  LogOut,
  Globe,
} from 'lucide-react';
import { useTheme } from '@/src/components/ui/theme-provider';
import { useLanguage } from '@/src/contexts/language-context';
import { t } from '@/lib/i18n';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'integrations' | 'appearance'>('profile');
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: '',
    currency: 'CFA',
    logoUrl: null as string | null,
  });
  const [logoUploading, setLogoUploading] = useState(false);

  const [notifs, setNotifs] = useState({
    shipments: true,
    fleet: true,
    billing: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyRes, notifRes] = await Promise.all([
          fetch('/api/company'),
          fetch('/api/settings/notifications'),
        ]);

        if (companyRes.ok) {
          const company = await companyRes.json();
          setCompanyData({
            name: company.name ?? '',
            email: company.email ?? '',
            phone: company.phone ?? '',
            taxId: company.taxId ?? '',
            address:
              company.address && company.city
                ? `${company.address}\n${company.city}`
                : company.address ?? '',
            currency: company.currency ?? 'CFA',
            logoUrl: company.logoUrl ?? null,
          });
        }

        if (notifRes.ok) {
          const prefs = await notifRes.json();
          setNotifs({
            shipments: !!prefs.shipments,
            fleet: !!prefs.fleet,
            billing: !!prefs.billing,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSaveError('Veuillez choisir une image (PNG, JPG ou WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSaveError('Image trop volumineuse (max 2 Mo).');
      return;
    }
    setLogoUploading(true);
    setSaveError(null);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('folder', 'logo');
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Échec de l\'upload');
      }
      const { url } = await res.json();
      setCompanyData((prev) => ({ ...prev, logoUrl: url }));
      const patchRes = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: url }),
      });
      if (!patchRes.ok) setSaveError('Logo mis à jour localement. Cliquez sur Sauvegarder.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de l\'upload du logo.');
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText('pk_live_51Mz...q3tZ8x9');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaved(false);
    setSaveError(null);
    try {
      const [companyRes, notifRes] = await Promise.all([
        fetch('/api/company', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: companyData.name,
            email: companyData.email,
            phone: companyData.phone,
            taxId: companyData.taxId,
            address: companyData.address,
            currency: companyData.currency,
            logoUrl: companyData.logoUrl,
          }),
        }),
        fetch('/api/settings/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifs),
        }),
      ]);

      if (!companyRes.ok || !notifRes.ok) {
        const errCompany = await companyRes.json().catch(() => ({}));
        const errNotif = await notifRes.json().catch(() => ({}));
        const msg =
          errCompany.error ||
          errNotif.error ||
          'Impossible de sauvegarder les paramètres.';
        setSaveError(msg);
        return;
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      setSaveError('Erreur réseau lors de la sauvegarde.');
    }
  };

  return (
    <div className="flex-1 bg-background text-text-main min-h-screen">
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
          <TabButton 
            active={activeTab === 'appearance'} 
            onClick={() => setActiveTab('appearance')}
            icon={<Sun size={18} />} 
            label="Apparence & Langue" 
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

              {saveError && (
                <p className="mb-4 text-sm text-red-500 font-medium">{saveError}</p>
              )}

              <div className="bg-surface rounded-2xl border border-border p-8 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Nom de l'entreprise"
                    icon={<Building2 size={16} />}
                    value={companyData.name}
                    onChange={(val: string) =>
                      setCompanyData({ ...companyData, name: val })
                    }
                  />
                  <InputField
                    label="Email Business"
                    icon={<Mail size={16} />}
                    value={companyData.email}
                    onChange={(val: string) =>
                      setCompanyData({ ...companyData, email: val })
                    }
                  />
                  <InputField
                    label="Téléphone"
                    icon={<Phone size={16} />}
                    value={companyData.phone}
                    onChange={(val: string) =>
                      setCompanyData({ ...companyData, phone: val })
                    }
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase ml-1">Monnaie</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">💰</div>
                      <select
                        value={companyData.currency}
                        onChange={(e) => setCompanyData({ ...companyData, currency: e.target.value })}
                        className="w-full bg-border border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                      >
                        <option value="CFA">CFA (Franc CFA)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="USD">USD (Dollar US)</option>
                        <option value="XOF">XOF (Franc Ouest-Africain)</option>
                      </select>
                    </div>
                  </div>
                  <InputField
                    label="N° TVA / Tax ID"
                    icon={<Fingerprint size={16} />}
                    value={companyData.taxId}
                    onChange={(val: string) =>
                      setCompanyData({ ...companyData, taxId: val })
                    }
                  />
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase ml-1">Adresse du Siège</label>
                    <textarea 
                      className="w-full bg-border border border-border rounded-xl p-4 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all h-32"
                      value={companyData.address}
                      onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                    />
                  </div>

                {/* Nom et logo en bas + Déconnexion */}
                <div className="mt-10 pt-10 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="relative group cursor-pointer rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <div className="size-16 rounded-2xl bg-border border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-colors group-hover:border-primary">
                        {companyData.logoUrl ? (
                          <img src={companyData.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                          <Building2 className="w-8 h-8 text-text-muted" />
                        )}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                          {logoUploading ? <span className="text-xs text-white">…</span> : <Upload size={20} className="text-white" />}
                        </div>
                      </div>
                    </button>
                    <div>
                      <h4 className="font-bold text-text-main">Nom et logo de l'entreprise</h4>
                      <p className="text-sm text-text-muted">Modifiez le nom ci-dessus. Logo : PNG, JPG ou WEBP, max 2 Mo.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                        if (res.ok) window.location.href = '/login';
                      } catch {}
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-danger/50 text-danger hover:bg-danger/10 font-medium transition-colors"
                  >
                    <LogOut size={18} />
                    Déconnexion
                  </button>
                </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'appearance' && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold mb-6">Apparence et langue</h3>
              <div className="bg-surface rounded-2xl border border-border p-8 shadow-xl space-y-8">
                <div>
                  <h4 className="font-bold text-text-main mb-2 flex items-center gap-2">
                    <Sun size={18} className="text-primary" />
                    Thème
                  </h4>
                  <p className="text-sm text-text-muted mb-4">Choisissez le mode d'affichage de l'application.</p>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border hover:bg-border/50 transition-colors"
                  >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    {theme === 'dark' ? t(lang, 'sidebar.theme.light') : t(lang, 'sidebar.theme.dark')}
                  </button>
                </div>
                <div>
                  <h4 className="font-bold text-text-main mb-2 flex items-center gap-2">
                    <Globe size={18} className="text-primary" />
                    Langue
                  </h4>
                  <p className="text-sm text-text-muted mb-4">Langue d'affichage de l'interface.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLang('fr')}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors ${lang === 'fr' ? 'bg-primary text-white' : 'bg-border text-text-muted hover:text-text-main'}`}
                    >
                      Français
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors ${lang === 'en' ? 'bg-primary text-white' : 'bg-border text-text-muted hover:text-text-main'}`}
                    >
                      English
                    </button>
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