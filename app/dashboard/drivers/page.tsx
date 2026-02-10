'use client';

import React, { useState, useMemo } from 'react';
import { 
  Leaf, Shield, Map, Phone, Mail, Edit3, Save, X, 
  Search, Bell, MessageSquare, CheckCircle, Navigation,
  TrendingUp, Truck, Award, Calendar
} from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_DRIVER = {
  name: "Marcus Thorne",
  id: "#8821",
  role: "Senior Logistics Driver",
  status: "ACTIVE",
  phone: "+1 (555) 123-4567",
  email: "marcus.t@ecosync.com",
  vehicle: "Volvo VNL",
  region: "West Coast",
  since: "2019",
  avatar: "https://i.pravatar.cc/150?u=17"
};

const ROUTES = [
  { id: 1, date: "Jun 14, 2024", time: "08:30 AM", route: "Seattle → Portland", distance: "174 mi", score: 98, status: "Completed" },
  { id: 2, date: "Jun 12, 2024", time: "06:15 AM", route: "Spokane → Seattle", distance: "279 mi", score: 84, status: "Completed" },
  { id: 3, date: "Jun 10, 2024", time: "09:00 AM", route: "Local Distribution", distance: "45 mi", score: 96, status: "Completed" },
  { id: 4, date: "Jun 08, 2024", time: "05:45 AM", route: "Vancouver → Seattle", distance: "142 mi", score: 92, status: "Completed" },
];

export default function PerformancePage() {
  // --- ÉTATS ---
  const [isEditing, setIsEditing] = useState(false);
  const [driver, setDriver] = useState(INITIAL_DRIVER);
  const [searchQuery, setSearchQuery] = useState('');

  // --- LOGIQUE ---
  const filteredRoutes = useMemo(() => {
    return ROUTES.filter(r => 
      r.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.date.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSave = () => {
    setIsEditing(false);
    // Ici : appel API pour sauvegarder
  };

  return (
    <div className="flex-1 bg-background text-text-main min-h-screen">
      {/* HEADER */}

      <main className="max-w-[1400px] mx-auto  lg:p-2 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNE GAUCHE : PROFIL */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-surface rounded-3xl border border-border p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent" />
            
            <div className="relative mb-6">
              <div className="size-32 mx-auto rounded-full border-4 border-surface shadow-2xl overflow-hidden ring-1 ring-border">
                <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
              </div>
              <span className="absolute bottom-1 right-1/4 bg-primary text-background text-[10px] font-black px-3 py-1 rounded-full border-2 border-surface">
                {driver.status}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-3 mb-4">
                <input 
                  className="w-full bg-border border border-border rounded-lg p-2 text-center text-sm text-text-main"
                  value={driver.name}
                  onChange={(e) => setDriver({...driver, name: e.target.value})}
                />
                <input 
                  className="w-full bg-border border border-border rounded-lg p-2 text-center text-xs text-text-muted"
                  value={driver.role}
                  onChange={(e) => setDriver({...driver, role: e.target.value})}
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight">{driver.name}</h1>
                <p className="text-text-muted text-sm mb-6">{driver.role}</p>
              </>
            )}

            <div className="flex justify-center gap-2 mb-8">
              <Badge label={`ID: ${driver.id}`} />
              <Badge label={`Depuis ${driver.since}`} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <InfoBox icon={<Truck size={16}/>} label="Véhicule" value={driver.vehicle} />
              <InfoBox icon={<Map size={16}/>} label="Région" value={driver.region} />
            </div>

            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="w-full py-3 bg-primary hover:bg-primaryHover text-background font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-primary/10"
            >
              {isEditing ? <><Save size={18}/> Sauvegarder</> : <><Edit3 size={18}/> Modifier Profil</>}
            </button>
            {isEditing && (
              <button onClick={() => setIsEditing(false)} className="w-full mt-2 text-xs text-text-muted hover:text-text-main transition-colors">Annuler</button>
            )}
          </div>

          {/* CONTACT INFO */}
          <div className="bg-surface rounded-3xl border border-border p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">Informations</h3>
            <ContactRow icon={<Phone size={14}/>} label="Téléphone" value={driver.phone} />
            <ContactRow icon={<Mail size={14}/>} label="Email" value={driver.email} />
            <div className="pt-4 border-t border-border">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Certifications</h3>
              <div className="flex flex-wrap gap-2">
                <CertBadge label="Hazmat" color="emerald" />
                <CertBadge label="Class A CDL" color="blue" />
                <CertBadge label="Eco-Driving" color="primary" />
              </div>
            </div>
          </div>
        </aside>

        {/* COLONNE DROITE : ANALYTICS */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Score Éco" value="94" sub="/100" trend="+2.1%" icon={<Leaf size={20}/>} color="primary" />
            <MetricCard title="Note Sécurité" value="4.8" sub="/5.0" trend="+0.5%" icon={<Shield size={20}/>} color="blue" />
            <MetricCard title="Distance Totale" value="42,508" trend="1.2k" icon={<Navigation size={20}/>} color="orange" />
          </div>

          {/* CHART */}
          <div className="bg-surface rounded-3xl border border-border p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
              <div>
                <h3 className="text-xl font-bold text-text-main">Consommation (MPG)</h3>
                <p className="text-sm text-text-muted">Moyenne de carburant sur les 6 derniers mois</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-primary">8.4 <span className="text-sm font-normal text-text-muted">MPG</span></span>
                <p className="text-[10px] font-bold text-primary uppercase">Top 5% de la flotte</p>
              </div>
            </div>
            
            {/* SVG CHART - RE-STYLISÉ */}
            <div className="h-64 w-full group">
              <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#13ec5b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#13ec5b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,120 Q50,40 100,80 T200,60 T300,100 T400,20 T500,50 L500,150 L0,150 Z" fill="url(#grad)" />
                <path d="M0,120 Q50,40 100,80 T200,60 T300,100 T400,20 T500,50" fill="none" stroke="#13ec5b" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-text-muted uppercase">
                <span>Jan</span><span>Fev</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span>
              </div>
            </div>
          </div>

          {/* TABLEAU HISTORIQUE */}
          <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-border/20">
              <h3 className="text-lg font-bold">Historique des trajets</h3>
              <button className="text-xs font-bold text-primary hover:underline">Voir tout</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-border/50 text-[10px] font-black uppercase text-text-muted tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Itinéraire</th>
                    <th className="px-8 py-4">Distance</th>
                    <th className="px-8 py-4 text-center">Score</th>
                    <th className="px-8 py-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-border/20 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-text-main">{route.date}</div>
                        <div className="text-[10px] text-text-muted">{route.time}</div>
                      </td>
                      <td className="px-8 py-5 font-medium text-text-muted">
                        {route.route}
                      </td>
                      <td className="px-8 py-5 text-text-muted font-mono text-xs">{route.distance}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          route.score > 90 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent border-accent/20'
                        }`}>
                          {route.score}/100
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-primary font-bold text-xs">
                          <CheckCircle size={14} /> Terminée
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRoutes.length === 0 && (
                <div className="p-10 text-center text-text-muted italic">Aucun trajet correspondant</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function Badge({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 bg-border border border-border rounded-full text-[10px] font-bold text-text-muted uppercase tracking-tight">
      {label}
    </span>
  );
}

function InfoBox({ icon, label, value }: any) {
  return (
    <div className="bg-border/50 p-3 rounded-2xl border border-border text-center">
      <div className="text-primary flex justify-center mb-1">{icon}</div>
      <div className="text-[10px] text-text-muted uppercase font-bold">{label}</div>
      <div className="text-xs font-bold">{value}</div>
    </div>
  );
}

function ContactRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="size-8 rounded-xl bg-border flex items-center justify-center text-text-muted border border-border">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold text-text-muted uppercase">{label}</div>
        <div className="text-xs font-medium">{value}</div>
      </div>
    </div>
  );
}

function CertBadge({ label, color }: any) {
  const colors: any = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-primary/10 text-primary border-primary/20',
  };
  return <span className={`px-2 py-1 rounded text-[10px] font-black border uppercase ${colors[color]}`}>{label}</span>;
}

function MetricCard({ title, value, sub, trend, icon, color }: any) {
  const colorMap: any = {
    primary: 'text-primary bg-primary/10',
    blue: 'text-blue-400 bg-blue-400/10',
    orange: 'text-orange-400 bg-orange-400/10',
  };
  return (
    <div className="bg-surface p-6 rounded-3xl border border-border shadow-xl flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>{icon}</div>
        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 flex items-center gap-1">
          <TrendingUp size={10} /> {trend}
        </span>
      </div>
      <div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-text-main mt-1">
          {value}<span className="text-sm font-normal text-text-muted">{sub}</span>
        </h3>
      </div>
    </div>
  );
}