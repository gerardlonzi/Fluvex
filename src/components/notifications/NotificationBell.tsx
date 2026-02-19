'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Bell, X, Settings, AlertTriangle, PlusCircle, 
  RefreshCw, Trash2, Gauge, CloudRain, Zap 
} from 'lucide-react';

type AlertItem = { 
  id: string; 
  type: string; 
  title: string; 
  description: string | null; 
  readAt: string | null; 
  createdAt: string 
};

// Configuration utilisant ton Design System
const ALERT_CONFIG = {
  NEW: { label: 'Nouveau', icon: PlusCircle, color: 'text-primary', bg: 'bg-primary/10' },
  UPDATE: { label: 'Mise à jour', icon: RefreshCw, color: 'text-accent', bg: 'bg-accent/10' },
  DELETE: { label: 'Suppression', icon: Trash2, color: 'text-danger', bg: 'bg-danger/10' },
  BREAKDOWN: { label: 'Panne', icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
  SPEED: { label: 'Vitesse', icon: Gauge, color: 'text-accent', bg: 'bg-accent/10' },
  WEATHER: { label: 'Météo', icon: CloudRain, color: 'text-text-muted', bg: 'bg-border/30' },
  OPTIMIZATION: { label: 'Optimisation', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
  OTHER: { label: 'Autre', icon: Bell, color: 'text-text-muted', bg: 'bg-border/30' },
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const queryParam = (isOpen && notifTab === 'unread') ? '?unreadOnly=true' : '';
      const res = await fetch(`/api/alerts${queryParam}`, { credentials: 'include' });
      if (!res.ok) return;
      const data: AlertItem[] = await res.json();
      setAlerts(data);
      setUnreadCount(data.filter(a => !a.readAt).length);
    } catch (error) {
      console.error("Erreur chargement notifs", error);
    }
  }, [isOpen, notifTab]);

  // Polling intelligent : Respecte ton CPU et ta batterie
  useEffect(() => {
    const fetchInterval = 15000; // 15 secondes
    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      loadData();
      intervalId = setInterval(() => {
        if (!document.hidden && !isOpen) loadData();
      }, fetchInterval);
    };

    startPolling();

    const handleVisibility = () => {
      if (document.hidden) clearInterval(intervalId);
      else startPolling();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadData, isOpen]);

  const displayAlerts = notifTab === 'unread' 
    ? alerts.filter((a) => !a.readAt) 
    : alerts.slice(0, 20);

  const markOneRead = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, readAt: new Date().toISOString() } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await fetch(`/api/alerts/${id}/read`, { method: 'PATCH', credentials: 'include' });
  };

  const markAllRead = async () => {
    const ids = alerts.filter(a => !a.readAt).map(a => a.id);
    if (ids.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(ids.map(id => fetch(`/api/alerts/${id}/read`, { method: 'PATCH', credentials: 'include' })));
      await loadData();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      {/* Bouton Cloche */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg hover:bg-border/50 transition-colors text-text-main"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-danger text-[10px] font-bold text-white rounded-full flex items-center justify-center ring-2 ring-background animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          
          {/* Panel */}
          <div className="relative w-full max-w-md h-full bg-surface shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface">
              <div>
                <h2 className="text-xl font-bold text-text-main">Notifications</h2>
                <p className="text-xs text-text-muted font-medium">{unreadCount} messages non lus</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-border/50 rounded-full text-text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs & Actions */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex gap-1 bg-background p-1 rounded-lg border border-border">
                <button 
                  onClick={() => setNotifTab('all')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${notifTab === 'all' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                  TOUTES
                </button>
                <button 
                  onClick={() => setNotifTab('unread')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${notifTab === 'unread' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                  NON LUES
                </button>
              </div>
              <button 
                onClick={markAllRead} 
                disabled={unreadCount === 0 || markingAll}
                className="text-xs font-bold text-primary hover:text-primaryHover disabled:opacity-30 uppercase tracking-tight"
              >
                {markingAll ? '...' : 'Tout lire'}
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {displayAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-text-muted opacity-40">
                  <Bell className="w-12 h-12 mb-4" />
                  <p className="text-sm font-medium">Aucune notification</p>
                </div>
              ) : (
                displayAlerts.map((alert) => {
                  const config = ALERT_CONFIG[alert.type as keyof typeof ALERT_CONFIG] || ALERT_CONFIG.OTHER;
                  const Icon = config.icon;

                  return (
                    <button
                      key={alert.id}
                      onClick={() => !alert.readAt && markOneRead(alert.id)}
                      className={`relative w-full text-left p-4 border-gray-600 border-b transition-all flex gap-4 ${
                        !alert.readAt 
                          ? 'bg-surface border-primary/20 shadow-sm' 
                          : 'bg-transparent border-border/50 opacity-60'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${config.bg}`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className="text-sm font-bold text-text-main leading-tight truncate">
                            {alert.title}
                          </h4>
                          <span className="text-[10px] font-medium text-text-muted whitespace-nowrap">
                            {new Date(alert.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                          {alert.description || '—'}
                        </p>
                      </div>

                      {!alert.readAt && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(19,236,91,0.5)]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-background/50 border-t border-border">
              <Link 
                href="/dashboard/settings" 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-surface border border-border text-text-main font-bold rounded-xl hover:border-primary/50 transition-all text-sm"
              >
                <Settings className="w-4 h-4" />
                Paramètres
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}