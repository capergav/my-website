"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Locale } from "@/app/lib/translations";
import {
  getCategoryLabel as getCategoryLabelFn,
  t as tFn,
} from "@/app/lib/translations";

const STORAGE_KEY = "menusnap-locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  getCategoryLabel: (category: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const VALID_LOCALES: Locale[] = ["en", "fr", "zh", "ar", "es", "ko", "pa", "yue", "tl", "hi"];

function getStoredLocale(defaultLocale = "en"): Locale {
  if (typeof window === "undefined") return defaultLocale as Locale;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_LOCALES.includes(stored as Locale)) return stored as Locale;
  return VALID_LOCALES.includes(defaultLocale as Locale) ? (defaultLocale as Locale) : "en";
}

export function LanguageProvider({ children, initialLanguage }: { children: React.ReactNode; initialLanguage?: string }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale(initialLanguage));
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, locale);
    const html = document.documentElement;
    html.setAttribute("lang", locale === "zh" ? "zh-Hans" : locale === "yue" ? "zh-yue" : locale);
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key: string) => tFn(key, locale),
    [locale]
  );

  const getCategoryLabel = useCallback(
    (category: string) => getCategoryLabelFn(category, locale),
    [locale]
  );

  const value: LanguageContextValue = {
    locale,
    setLocale,
    t,
    getCategoryLabel,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
