// Native-script font support for the multilingual QR signs.
//
// The signs print language names in their own scripts (简体中文, العربية, ਪੰਜਾਬੀ …).
// Canvas draws with whatever font the browser can resolve, so on a machine that
// lacks a CJK / Arabic / Devanagari / Gurmukhi face those names come out as tofu
// boxes. To guarantee they always draw we pull a *character-subset* webfont from
// Google Fonts (`&text=` → a few hundred bytes per script, not megabytes) and
// wait for it to load before rendering.
//
// The language list itself is derived from app/lib/translations.ts, so adding a
// locale there automatically puts it on every sign — nothing here to update.

import { locales, type Locale } from "@/app/lib/translations";

export type ScriptKey =
  | "latin" | "sc" | "tc" | "jp" | "kr" | "arabic" | "devanagari" | "gurmukhi";

export type SignLanguage = {
  locale: Locale;
  label: string;      // native name, upper-cased (a no-op for non-cased scripts)
  script: ScriptKey;
  rtl: boolean;
};

// Explicit mapping wins: 日本語 and 廣東話 are pure Han, so codepoint sniffing
// alone would file them both under Simplified Chinese.
const SCRIPT_BY_LOCALE: Partial<Record<Locale, ScriptKey>> = {
  zh: "sc", yue: "tc", ja: "jp", ko: "kr",
  ar: "arabic", hi: "devanagari", pa: "gurmukhi",
};

// Fallback for locales added to translations.ts that nobody mapped above —
// a new language still gets a real font instead of boxes.
const RANGE_TESTS: { key: ScriptKey; re: RegExp }[] = [
  { key: "arabic",     re: /[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]/ },
  { key: "devanagari", re: /[\u0900-\u097f]/ },
  { key: "gurmukhi",   re: /[\u0a00-\u0a7f]/ },
  { key: "kr",         re: /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/ },
  { key: "jp",         re: /[\u3040-\u30ff]/ },       // kana — test before Han
  { key: "sc",         re: /[\u3400-\u4dbf\u4e00-\u9fff]/ },
];

export function scriptFor(locale: string, label: string): ScriptKey {
  const mapped = SCRIPT_BY_LOCALE[locale as Locale];
  if (mapped) return mapped;
  for (const t of RANGE_TESTS) if (t.re.test(label)) return t.key;
  return "latin";
}

/** Every language the menu is actually translated into, in native script. */
export function getSignLanguages(): SignLanguage[] {
  return locales.map((l) => {
    const script = scriptFor(l.value, l.label);
    // Upper-casing is a no-op for Han/Arabic/Devanagari/Gurmukhi/Hangul, so this
    // only affects the Latin names (English → ENGLISH, Français → FRANÇAIS).
    return { locale: l.value, label: l.label.toUpperCase(), script, rtl: script === "arabic" };
  });
}

export const LANGUAGE_COUNT = locales.length;

// Google family name + a system fallback chain, so the sign still renders
// correctly if the webfont request never lands (offline, blocked, slow).
const SCRIPT_FONTS: Record<Exclude<ScriptKey, "latin">, { google: string; stack: string }> = {
  sc:         { google: "Noto Sans SC",         stack: `"Noto Sans SC","Noto Sans CJK SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Heiti SC",sans-serif` },
  tc:         { google: "Noto Sans TC",         stack: `"Noto Sans TC","Noto Sans CJK TC","PingFang TC","Microsoft JhengHei","Heiti TC",sans-serif` },
  jp:         { google: "Noto Sans JP",         stack: `"Noto Sans JP","Noto Sans CJK JP","Hiragino Sans","Yu Gothic","Meiryo",sans-serif` },
  kr:         { google: "Noto Sans KR",         stack: `"Noto Sans KR","Noto Sans CJK KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif` },
  arabic:     { google: "Noto Sans Arabic",     stack: `"Noto Sans Arabic","Geeza Pro","Segoe UI","Tahoma",sans-serif` },
  devanagari: { google: "Noto Sans Devanagari", stack: `"Noto Sans Devanagari","Nirmala UI","Kohinoor Devanagari","Devanagari Sangam MN","Mangal",sans-serif` },
  gurmukhi:   { google: "Noto Sans Gurmukhi",   stack: `"Noto Sans Gurmukhi","Nirmala UI","Gurmukhi MN","Raavi",sans-serif` },
};

/** Canvas font-family list for a script. Latin uses the owner's picked font. */
export function fontStackFor(script: ScriptKey, latinStack: string): string {
  if (script === "latin") return latinStack;
  return SCRIPT_FONTS[script].stack;
}

const loading = new Map<string, Promise<void>>();

function injectStylesheet(href: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.qrFont = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();   // fall back to the system chain
    document.head.appendChild(link);
  });
}

function loadScriptFont(script: Exclude<ScriptKey, "latin">, chars: string): Promise<void> {
  const { google } = SCRIPT_FONTS[script];
  const text = Array.from(new Set(Array.from(chars))).join("");
  const key = `${google}|${text}`;
  const cached = loading.get(key);
  if (cached) return cached;

  const href =
    `https://fonts.googleapis.com/css2?family=${google.replace(/ /g, "+")}:wght@400;700` +
    `&text=${encodeURIComponent(text)}&display=swap`;

  const task = (async () => {
    await injectStylesheet(href);
    // Actually pull the file down — a stylesheet alone doesn't fetch the font,
    // and canvas has no lazy-load: an unloaded face silently draws as boxes.
    await Promise.all([
      document.fonts.load(`400 40px "${google}"`, text).catch(() => []),
      document.fonts.load(`700 40px "${google}"`, text).catch(() => []),
    ]);
  })();

  loading.set(key, task);
  return task;
}

/**
 * Make sure every script used by `items` has a drawable font before painting.
 * Resolves early (falling back to system fonts) rather than blocking a preview.
 */
export async function ensureScriptFonts(
  items: { label: string; script: ScriptKey }[],
  timeoutMs = 6000,
): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;

  const byScript = new Map<Exclude<ScriptKey, "latin">, string>();
  for (const it of items) {
    if (it.script === "latin") continue;
    const s = it.script as Exclude<ScriptKey, "latin">;
    byScript.set(s, (byScript.get(s) ?? "") + it.label);
  }
  if (!byScript.size) return;

  const loads = Array.from(byScript, ([script, chars]) => loadScriptFont(script, chars));
  await Promise.race([
    Promise.all(loads),
    new Promise<void>((r) => setTimeout(r, timeoutMs)),
  ]);
}

/** True when the browser can draw `label` in its script's webfont. */
export function scriptFontReady(script: ScriptKey, label: string): boolean {
  if (script === "latin") return true;
  if (typeof document === "undefined" || !document.fonts) return false;
  try { return document.fonts.check(`400 40px "${SCRIPT_FONTS[script].google}"`, label); }
  catch { return false; }
}
