'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { messages, type Messages } from './messages';
import type { Locale } from '@/types';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, defaultLocale = 'en' }: { children: ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartchat-locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('smartchat-locale');
    if (saved === 'en' || saved === 'zh') {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: messages[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
