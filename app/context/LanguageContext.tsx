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
import { trackEvent, detectDevice, getVisitorId } from "@/lib/analytics";

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

export function LanguageProvider({ children, initialLanguage, restaurantId }: { children: React.ReactNode; initialLanguage?: string; restaurantId?: string }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);
  const languageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Clean up any pending language_use timer on unmount
  useEffect(() => {
    return () => {
      if (languageTimerRef.current) clearTimeout(languageTimerRef.current);
    };
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);

    // Only track on the customer menu (restaurantId required)
    if (!restaurantId) return;

    // Cancel pending timer — user changed mind before 8s elapsed
    if (languageTimerRef.current) clearTimeout(languageTimerRef.current);

    // Only record after 8 seconds of staying on this language
    languageTimerRef.current = setTimeout(() => {
      const sessionId = sessionStorage.getItem("dl_session") ?? "";
      trackEvent({
        restaurant_id: restaurantId,
        event_type: "language_use",
        language: newLocale,
        session_id: sessionId,
        device_type: detectDevice(),
        user_agent: navigator.userAgent,
        referrer: document.referrer ?? "",
        visitor_id: getVisitorId(),
      });
    }, 8000);
  }, [restaurantId]);

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
