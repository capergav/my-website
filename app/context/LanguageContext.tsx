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

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  const valid: Locale[] = ["en", "fr", "zh", "ar", "es"];
  return valid.includes(stored as Locale) ? (stored as Locale) : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, locale);
    const html = document.documentElement;
    html.setAttribute("lang", locale === "zh" ? "zh-Hans" : locale);
    html.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
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
