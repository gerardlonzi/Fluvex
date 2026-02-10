'use client';

import React from 'react';
import { 
  Leaf, 
  Bell, 
  ChevronRight, 
  UserCircle, 
  Package, 
  Truck, 
  Calendar, 
  Search, 
  Info, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Scale,
  Maximize
} from 'lucide-react';

export default function CreateLivraison() {
  return (
    <div className="min-h-screen bg-[#020617] font-sans text-[#f8fafc] antialiased">
      {/* Navigation */}
     
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Formulaire Principal */}
          <div className="lg:col-span-8 space-y-8">
            <div>
              <h1 className="text-3xl font-extrabold text-[#f8fafc]">Create New Livraison</h1>
              <p className="mt-2 text-[#94a3b8]">Remplissez les détails pour planifier un envoi durable.</p>
            </div>

            {/* Recipient Details */}
            <section className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 md:p-8 shadow-sm">
              <div className="flex items-center mb-8">
                <div className="h-10 w-10 rounded-xl bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b] mr-4">
                  <UserCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-[#f8fafc]">Recipient Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Company Name</label>
                  <input type="text" className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] focus:ring-2 focus:ring-[#13ec5b] focus:border-transparent transition-all p-3" placeholder="e.g. Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Contact Name</label>
                  <input type="text" className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] focus:ring-2 focus:ring-[#13ec5b] p-3" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Phone Number</label>
                  <input type="tel" className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] focus:ring-2 focus:ring-[#13ec5b] p-3" placeholder="+33 6 00 00 00 00" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Delivery Address</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                    <input type="text" className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] pl-11 p-3 focus:ring-2 focus:ring-[#13ec5b]" placeholder="Start typing address..." />
                  </div>
                </div>
              </div>
            </section>

            {/* Package Info */}
            <section className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 md:p-8">
              <div className="flex items-center mb-8">
                <div className="h-10 w-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] mr-4">
                  <Package className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">Package Info</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Total Weight (kg)</label>
                  <div className="relative">
                    <Scale className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    <input type="number" className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]" placeholder="0.0" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Dimensions (cm)</label>
                  <div className="flex gap-2">
                    {['L', 'W', 'H'].map(dim => (
                      <input key={dim} type="number" className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]" placeholder={dim} />
                    ))}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Package Type</label>
                  <select className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b] appearance-none">
                    <option>Standard Box</option>
                    <option>Fragile / Glass</option>
                    <option>Refrigerated</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Driver Assignment */}
            <section className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 md:p-8">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 rounded-xl bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b] mr-4">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Driver Assignment</h2>
                  <p className="text-sm text-[#94a3b8]">Assign a driver or use smart auto-assign.</p>
                </div>
              </div>
              
              <div className="bg-[#6366f1]/5 border border-[#6366f1]/20 rounded-xl p-4 mb-6 flex items-start gap-4">
                <Info className="w-5 h-5 text-[#6366f1] mt-1" />
                <div>
                  <h4 className="text-sm font-semibold text-[#f8fafc]">Smart Suggestion</h4>
                  <p className="text-sm text-[#94a3b8] mt-1">
                    Basé sur la proximité, <span className="text-[#f8fafc] font-medium">Marcus T.</span> (0.8km) est le meilleur choix.
                  </p>
                  <button className="mt-3 text-xs font-bold text-[#13ec5b] hover:text-[#10b981] flex items-center gap-1 uppercase tracking-wider">
                    Assign Marcus T. <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <select className="w-full bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-4 focus:ring-2 focus:ring-[#13ec5b]">
                <option>Auto-assign (Best Available)</option>
                <option>Marcus T. • Electric Van</option>
                <option>Sarah L. • Cargo Bike</option>
              </select>
            </section>

            {/* Priority Selection */}
            <section className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 md:p-8">
              <div className="flex items-center mb-8">
                <div className="h-10 w-10 rounded-xl bg-[#13ec5b]/10 flex items-center justify-center text-[#13ec5b] mr-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">Priority & Scheduling</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { id: 'eco', name: 'Eco-Saver', desc: '2-3 Days', co2: '-0.8kg CO2', active: true },
                  { id: 'std', name: 'Standard', desc: 'Next Day', co2: 'Neutral', active: false },
                  { id: 'rush', name: 'Rush', desc: 'Today', co2: '+1.2kg CO2', active: false, danger: true }
                ].map((item) => (
                  <div 
                    key={item.id}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      item.active 
                        ? 'border-[#13ec5b] bg-[#13ec5b]/5' 
                        : 'border-[#1e293b] bg-[#020617] hover:border-[#94a3b8]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-bold">{item.name}</span>
                      {item.active && <CheckCircle2 className="w-5 h-5 text-[#13ec5b]" />}
                    </div>
                    <p className="text-sm text-[#94a3b8]">{item.desc}</p>
                    <div className={`mt-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${item.danger ? 'text-[#ef4444]' : 'text-[#13ec5b]'}`}>
                      <Leaf className="w-3 h-3" /> {item.co2}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="date" className="bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]" />
                <select className="bg-[#020617] border-[#1e293b] rounded-xl text-[#f8fafc] p-3 focus:ring-2 focus:ring-[#13ec5b]">
                  <option>09:00 - 12:00</option>
                  <option>12:00 - 15:00</option>
                  <option>Anytime</option>
                </select>
              </div>
            </section>
          </div>

          {/* Sidebar / Estimate */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="sticky top-24 space-y-6">
              {/* Map Preview */}
              <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] overflow-hidden group">
                <div className="h-48 w-full bg-[#1e293b] relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent z-10 opacity-60" />
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="text-[10px] font-bold text-[#13ec5b] uppercase tracking-tighter">Route Preview</span>
                    <p className="text-sm font-medium flex items-center gap-2">
                      Warehouse <ArrowRight className="w-3 h-3" /> Destination
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 z-20 bg-[#0f172a]/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold border border-[#1e293b]">
                    14.2 km
                  </div>
                </div>
              </div>

              {/* Cost & Carbon Summary */}
              <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#13ec5b]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                
                <h3 className="text-lg font-bold mb-6">Delivery Estimate</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-[#020617] rounded-xl border border-[#1e293b]">
                    <span className="text-[10px] text-[#94a3b8] uppercase font-bold">Est. Cost</span>
                    <p className="text-2xl font-black text-[#f8fafc] mt-1">$12.50</p>
                  </div>
                  <div className="p-4 bg-[#13ec5b]/10 rounded-xl border border-[#13ec5b]/20">
                    <span className="text-[10px] text-[#13ec5b] uppercase font-bold">Carbon</span>
                    <p className="text-2xl font-black text-[#13ec5b] mt-1">0.45 kg</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { label: 'Service', value: 'Eco-Saver' },
                    { label: 'Weight', value: '5.0 kg' },
                    { label: 'Offset', value: 'Included', highlight: true }
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-[#94a3b8]">{row.label}</span>
                      <span className={`font-semibold ${row.highlight ? 'text-[#13ec5b]' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full bg-[#13ec5b] text-[#020617] font-bold py-4 px-6 rounded-xl hover:bg-[#10b981] transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#13ec5b]/10">
                  Schedule Delivery <ArrowRight className="w-5 h-5" />
                </button>
                <button className="w-full mt-3 py-3 text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
                  Save as Draft
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-[#6366f1]/10 rounded-2xl p-5 border border-[#6366f1]/20 flex gap-4">
                <AlertCircle className="w-5 h-5 text-[#6366f1] shrink-0" />
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  <span className="text-[#f8fafc] font-semibold">Optimized Routing Active:</span> ECO-SYNC regroupe actuellement 3 autres livraisons dans cette zone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      
    </div>
  );
}