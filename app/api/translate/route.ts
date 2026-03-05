import { NextRequest, NextResponse } from "next/server";
import type { Locale } from "@/app/lib/translations";

const CACHE_MAX = 500;
const translationCache = new Map<string, string>();

function cacheKey(text: string, to: string): string {
  return `${to}:${text}`;
}

function getCached(text: string, to: string): string | undefined {
  return translationCache.get(cacheKey(text, to));
}

function setCache(text: string, to: string, translated: string): void {
  if (translationCache.size >= CACHE_MAX) {
    const first = translationCache.keys().next().value;
    if (first) translationCache.delete(first);
  }
  translationCache.set(cacheKey(text, to), translated);
}

const MYMEMORY_LANG: Record<Locale, string> = {
  en: "en",
  fr: "fr",
  zh: "zh-CN",
  ar: "ar",
  es: "es",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const to = typeof body.to === "string" ? (body.to as Locale) : "en";

    if (!text) {
      return NextResponse.json({ translated: "" });
    }

    if (to === "en") {
      return NextResponse.json({ translated: text });
    }

    const key = cacheKey(text, to);
    const cached = translationCache.get(key);
    if (cached !== undefined) {
      return NextResponse.json({ translated: cached });
    }

    const targetLang = MYMEMORY_LANG[to] ?? to;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ translated: text });
    }
    const data = (await res.json()) as { responseData?: { translatedText?: string }; status?: number };
    const translated = data.responseData?.translatedText ?? text;
    setCache(text, to, translated);
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ translated: "" });
  }
}
