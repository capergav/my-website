"use client";

import { useCallback, useEffect, useState } from "react";
import { locales, type Locale } from "@/app/lib/translations";

// Same key the customer menu uses, so a visitor's language choice carries over
// between the menu and the discovery map. (Legacy name — see LanguageContext.)
const STORAGE_KEY = "menusnap-locale";
const VALID: string[] = locales.map((l) => l.value);

// Browser-locale → DineLinks locale. Covers the few cases where the BCP-47 base
// tag doesn't equal our value (Filipino, Chinese variants).
function detectFromBrowser(): Locale | null {
  if (typeof navigator === "undefined") return null;
  const langs = [navigator.language, ...(navigator.languages ?? [])].filter(Boolean);
  for (const raw of langs) {
    const lower = raw.toLowerCase();
    const base = lower.split("-")[0];
    if (base === "fil" || base === "tl") return "tl";
    if (base === "zh") {
      if (lower.includes("hk") || lower.includes("yue") || lower.includes("hant")) return "yue";
      return "zh";
    }
    if (VALID.includes(base)) return base as Locale;
  }
  return null;
}

/**
 * Self-contained locale state for the map feature. Unlike the menu's
 * LanguageContext this does NOT record analytics (the map isn't a menu page)
 * and doesn't touch document.dir — RTL is handled on the page wrapper instead.
 */
export function useMapLocale() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let next: Locale | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID.includes(stored)) next = stored as Locale;
    } catch {}
    if (!next) next = detectFromBrowser();
    if (next) setLocaleState(next);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return { locale, setLocale };
}
