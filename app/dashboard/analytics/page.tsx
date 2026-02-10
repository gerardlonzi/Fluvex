'use client';

import React, { useState } from 'react';
import { 
  Truck, MapPin, Bell, Plus, Search, 
  Settings, Download, Calendar, Activity,
  Clock, Fuel, Car, AlertTriangle, Zap,
  CloudSnow, CheckCircle, MoreHorizontal,
  ChevronLeft, Leaf, Mail, User, TrendingUp, TrendingDown
} from 'lucide-react';

// --- TYPES & MOCK DATA ---
const DRIVERS_DATA = [
  { id: 'DRV-8832', name: 'John Doe', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=8', email: 'john.d@ecosync.com', role: 'Senior Driver', vehicle: 'Volvo VNL' },
  { id: 'DRV-1294', name: 'Sarah Smith', status: 'Idle', avatar: 'https://i.pravatar.cc/150?u=10', email: 'sarah.s@ecosync.com', role: 'Logistics Expert', vehicle: 'Freightliner' },
];

// --- MAIN APP COMPONENT ---
export default function Analytic() {

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <AnalyticsView />
      </main>   
    </div>
  );
}

// --- VIEW: ANALYTICS ---
function AnalyticsView() {
  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Analytics & Insights</h1>
          <p className="text-text-muted">Operational performance overview and cost analysis</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-xl text-sm font-bold hover:bg-border transition-colors text-text-main">
            <Calendar size={18} /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-xl text-sm font-bold hover:bg-primaryHover transition-all shadow-lg shadow-primary/20">
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Deliveries" value="12,450" trend="+12%" icon={<Truck className="text-primary" />} />
        <KPICard title="On-Time Rate" value="94.2%" trend="+2.1%" icon={<Clock className="text-primary" />} />
        <KPICard title="Avg Fuel Cost" value="$3.45" trend="-0.5%" icon={<Fuel className="text-accent" />} isDown />
        <KPICard title="Active Vehicles" value="142" trend="5 new" icon={<Car className="text-accent" />} hideIcon />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Trend */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-text-main">Cost Per Delivery Trend</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2 text-primary"><div className="size-2 rounded-full bg-primary"/> This Month</span>
              <span className="flex items-center gap-2 text-text-muted"><div className="size-2 rounded-full bg-border"/> Last Month</span>
            </div>
          </div>
          <div className="h-64 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200">
              <path d="M0,160 L100,120 L200,140 L300,80 L400,60 L500,90 L600,30 L700,50 L800,20" fill="none" stroke="#13ec5b" strokeWidth="3" strokeLinecap="round" />
              <path d="M0,180 L100,160 L200,190 L300,140 L400,120 L500,150 L600,100 L700,110 L800,80" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
        </div>

        {/* Hotspots Placeholder */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all" style={{ backgroundImage: "url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-74.006,40.7128,12/400x400?access_token=YOUR_TOKEN')" }} />
          <div className="relative p-6 z-10 bg-gradient-to-b from-background to-transparent">
             <h3 className="text-lg font-bold text-text-main flex items-center gap-2"><MapPin className="text-primary" size={20} /> Delivery Hotspots</h3>
             <p className="text-xs text-text-muted">High density delivery zones</p>
          </div>
        </div>

        {/* Delay Causes (Bar Chart) */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-text-main mb-6">Delay Root Causes</h3>
          <div className="flex items-end justify-between gap-3 h-40 px-2">
            <Bar label="Traffic" percent={65} color="bg-primary" />
            <Bar label="Vehicle" percent={30} color="bg-accent" />
            <Bar label="Weather" percent={45} color="bg-accent" />
            <Bar label="Loading" percent={15} color="bg-accent" />
            <Bar label="Route" percent={25} color="bg-danger" />
          </div>
        </div>

        {/* Fleet Status (Donut) */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold text-text-main w-full mb-6">Fleet Status</h3>
          <div className="relative size-40 rounded-full flex items-center justify-center mb-6" style={{ background: 'conic-gradient(#13ec5b 0% 65%, #6366f1 65% 85%, #ef4444 85% 100%)' }}>
            <div className="absolute size-32 bg-background rounded-full flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-text-main">142</span>
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">Vehicles</span>
            </div>
          </div>
          <div className="w-full space-y-2">
            <StatusIndicator label="Active" count="92" color="bg-primary" />
            <StatusIndicator label="Maintenance" count="28" color="bg-accent" />
            <StatusIndicator label="Inactive" count="22" color="bg-danger" />
          </div>
        </div>

        {/* Real-time Alerts */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-main">Real-time Alerts</h3>
            <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded text-primary">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase">Live</span>
            </div>
          </div>
          <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            <AlertItem icon={<AlertTriangle />} color="text-danger" bg="bg-danger/10" title="Vehicle #402 Breakdown" sub="Route 66 • Mike R." time="2m" />
            <AlertItem icon={<Zap />} color="text-accent" bg="bg-accent/10" title="Speed Limit Exceeded" sub="Truck 12 • 75mph zone" time="15m" />
            <AlertItem icon={<CloudSnow />} color="text-accent" bg="bg-accent/10" title="Weather: Heavy Snow" sub="Northeast Region" time="1h" />
            <AlertItem icon={<CheckCircle />} color="text-primary" bg="bg-primary/10" title="Route Optimized" sub="Saved 140 miles today" time="2h" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ANALYTICS UI COMPONENTS ---

function KPICard({ title, value, trend, icon, isDown, hideIcon }: any) {
  return (
    <div className="bg-surface border border-border p-5 rounded-2xl hover:bg-border/30 transition-all">
      <div className="flex justify-between items-start mb-2">
        <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">{title}</p>
        {icon}
      </div>
      <div className="flex items-end gap-3">
        <h3 className="text-3xl font-black text-text-main">{value}</h3>
        <div className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded ${isDown ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
          {!hideIcon && (isDown ? <TrendingDown size={10} className="mr-1"/> : <TrendingUp size={10} className="mr-1"/>)}
          {trend}
        </div>
      </div>
    </div>
  );
}

function Bar({ label, percent, color }: any) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1 group">
      <div className="w-full bg-border rounded-t-lg relative h-full flex items-end overflow-hidden">
        <div className={`w-full ${color} opacity-80 group-hover:opacity-100 transition-all`} style={{ height: `${percent}%` }} />
      </div>
      <span className="text-[10px] text-text-muted font-bold uppercase">{label}</span>
    </div>
  );
}

function StatusIndicator({ label, count, color }: any) {
  return (
    <div className="flex items-center justify-between text-xs font-bold text-text-main">
      <div className="flex items-center gap-2 text-text-muted">
        <div className={`size-2 rounded-full ${color}`} /> {label}
      </div>
      <span>{count}</span>
    </div>
  );
}

function AlertItem({ icon, title, sub, time, color, bg }: any) {
  return (
    <div className="flex gap-3 items-center group cursor-pointer">
      <div className={`size-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{title}</div>
        <div className="text-[10px] text-text-muted">{sub}</div>
      </div>
      <div className="text-[10px] text-text-muted font-medium">{time}</div>
    </div>
  );
}

// --- PREVIOUS VIEWS (FLEET & PERFORMANCE) ---
function PerformanceView({ driver, onBack }: any) {
  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-in slide-in-from-right duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-text-main mb-8 group">
        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Fleet
      </button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface border border-border p-8 rounded-3xl text-center">
          <img src={driver.avatar} className="size-32 rounded-full mx-auto mb-4 border-4 border-primary/20" />
          <h2 className="text-2xl font-black text-text-main">{driver.name}</h2>
          <p className="text-text-muted mb-6">{driver.role}</p>
          <div className="space-y-3 text-left bg-background/50 p-4 rounded-xl border border-border">
             <div className="flex items-center gap-3 text-sm text-text-main"><Mail size={16} className="text-primary"/> {driver.email}</div>
             <div className="flex items-center gap-3 text-sm text-text-main"><Car size={16} className="text-primary"/> {driver.vehicle}</div>
          </div>
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <KPICard title="Eco Score" value="92" trend="+3%" icon={<Leaf size={16} className="text-primary"/>} />
            <KPICard title="Deliveries" value="842" trend="Total" icon={<Activity size={16}/>} hideIcon />
            <KPICard title="Efficiency" value="98%" trend="+1%" icon={<Zap size={16} className="text-accent"/>} />
          </div>
          <div className="bg-surface border border-border p-6 rounded-2xl h-64 flex items-center justify-center">
            <p className="text-text-muted italic font-bold">Activity Graph Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}