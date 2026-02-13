'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Lang } from '@/lib/i18n';

const STORAGE_KEY = 'fluvex-lang';

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const defaultLang: Lang = 'fr';

const LanguageContext = createContext<LanguageContextValue>({
  lang: defaultLang,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(defaultLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === 'fr' || stored === 'en') setLangState(stored);
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const value = mounted ? { lang, setLang } : { lang: defaultLang, setLang };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
