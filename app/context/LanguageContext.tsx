"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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

export function LanguageProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale?: string }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);
  const langTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLangTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordedInitial = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const valid = ["en","fr","zh","ar","es","ko","pa","yue","tl","hi"];
    if (stored && valid.includes(stored)) {
      setLocaleState(stored as Locale);
    } else if (initialLocale && valid.includes(initialLocale)) {
      setLocaleState(initialLocale as Locale);
    }
    setMounted(true);
  }, [initialLocale]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, locale);
    const html = document.documentElement;
    html.setAttribute("lang", locale === "zh" ? "zh-Hans" : locale === "yue" ? "zh-yue" : locale);
  }, [locale, mounted]);

  // Record initial language after 30 seconds of staying on the menu
  useEffect(() => {
    if (!mounted || hasRecordedInitial.current) return;
    initialLangTimerRef.current = setTimeout(async () => {
      if (hasRecordedInitial.current) return;
      hasRecordedInitial.current = true;
      try {
        const slug = window.location.pathname.split('/menu/')[1]?.split('/')[0];
        if (!slug) return;
        const visitorId = localStorage.getItem('dl_visitor_id') ?? undefined;
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'language_use',
            restaurant_slug: slug,
            language: locale,
            visitor_id: visitorId,
          }),
        });
      } catch {}
    }, 30000);
    return () => {
      if (initialLangTimerRef.current)
        clearTimeout(initialLangTimerRef.current);
    };
  }, [mounted, locale]);

  // Clean up any pending language_use timer on unmount
  useEffect(() => {
    return () => {
      if (langTimerRef.current) clearTimeout(langTimerRef.current);
    };
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (langTimerRef.current) clearTimeout(langTimerRef.current);
    langTimerRef.current = setTimeout(async () => {
      try {
        const slug = window.location.pathname.split('/menu/')[1]?.split('/')[0];
        if (!slug) return;
        const visitorId = localStorage.getItem('dl_visitor_id') ?? undefined;
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'language_use',
            restaurant_slug: slug,
            language: newLocale,
            visitor_id: visitorId,
          }),
        });
      } catch {}
    }, 8000);
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
