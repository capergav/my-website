"use client";

import { useState, useEffect, useRef } from "react";
import type { Locale } from "@/app/lib/translations";

const cache = new Map<string, string>();

export function useTranslated(text: string, locale: Locale) {
  const [value, setValue] = useState<string>(text);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!text.trim()) {
      setValue("");
      return;
    }
    if (locale === "en") {
      setValue(text);
      return;
    }
    const key = `${locale}:${text}`;
    const cached = cache.get(key);
    if (cached !== undefined) {
      setValue(cached);
      return;
    }
    setLoading(true);
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, to: locale }),
    })
      .then((res) => res.json())
      .then((data: { translated?: string }) => {
        if (!mounted.current) return;
        const translated = typeof data.translated === "string" ? data.translated : text;
        if (translated) cache.set(key, translated);
        setValue(translated || text);
      })
      .catch(() => {
        if (mounted.current) setValue(text);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  }, [text, locale]);

  return { value, loading };
}
