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
  locales,
  t as tFn,
} from "@/app/lib/translations";

const STORAGE_KEY = "menusnap-locale";
// Derived from the canonical language list so a newly added locale is valid
// here automatically. This used to be hand-maintained and drifted — it listed
// "fil" instead of "tl", so a guest who picked Filipino lost the choice on
// every reload because the stored value never passed validation.
const VALID_LOCALES: string[] = locales.map((l) => l.value);

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  getCategoryLabel: (category: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

async function recordLanguage(language: string) {
  try {
    // Get restaurant_id and session_id from the page's data attributes
    // The menu page sets these on the body or a data element
    const restaurantId = document.body.dataset.restaurantId;
    const sessionId = sessionStorage.getItem("dl_session_id") ?? (() => {
      const id = Math.random().toString(36).slice(2);
      sessionStorage.setItem("dl_session_id", id);
      return id;
    })();
    const visitorId = localStorage.getItem("dl_visitor_id") ?? (() => {
      const id = crypto.randomUUID();
      localStorage.setItem("dl_visitor_id", id);
      return id;
    })();

    if (!restaurantId) return; // not on a menu page

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        event_type: "language_use",
        language,
        session_id: sessionId,
        visitor_id: visitorId,
      }),
    });
  } catch {}
}

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: string;
}) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordedInitial = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_LOCALES.includes(stored)) {
      setLocaleState(stored as Locale);
    } else if (initialLocale && VALID_LOCALES.includes(initialLocale)) {
      setLocaleState(initialLocale as Locale);
    }
    setMounted(true);
  }, [initialLocale]);

  // Save to localStorage + set lang attribute (no dir here)
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.setAttribute(
      "lang",
      locale === "zh" ? "zh-Hans" : locale
    );
  }, [locale, mounted]);

  // Record initial language after 30 seconds of engagement
  useEffect(() => {
    if (!mounted || recordedInitial.current) return;
    initialTimerRef.current = setTimeout(() => {
      recordedInitial.current = true;
      recordLanguage(locale);
    }, 30000);
    return () => {
      if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
    };
  }, [mounted, locale]);

  // Cleanup switch timer on unmount
  useEffect(() => {
    return () => {
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    };
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Cancel any pending timer
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    // Record after 8 seconds of staying on this language
    switchTimerRef.current = setTimeout(() => {
      recordLanguage(newLocale);
    }, 8000);
  }, []);

  const t = useCallback((key: string) => tFn(key, locale), [locale]);
  const getCategoryLabel = useCallback(
    (category: string) => getCategoryLabelFn(category, locale),
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, getCategoryLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
