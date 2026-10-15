"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Languages } from "lucide-react";
import { locales, t, type Locale } from "@/app/lib/translations";

// Native-script language picker for the map. No flags — a flag can't represent
// a language (English is not the USA, Arabic is not Saudi Arabia, etc.), and
// this product is Canadian and multilingual. Each option is shown in its own
// script so a speaker recognises their language without reading English.
export function MapLanguagePicker({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar";

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = window.innerWidth < 640 ? 170 : 190;
    let left = isRtl ? rect.left : rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setStyle({ position: "fixed", top: rect.bottom + 8, left, width, zIndex: 99999 });
  }, [isRtl]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (buttonRef.current?.contains(e.target as Node) || panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const current = locales.find((l) => l.value === locale) ?? locales[0];

  const panel = open && mounted
    ? createPortal(
        <div ref={panelRef} style={style} role="listbox">
          <ul
            className="py-1 rounded-xl bg-white border border-[#e8e4dd] shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto"
            dir={isRtl ? "rtl" : "ltr"}
          >
            {locales.map((opt) => (
              <li key={opt.value} role="option" aria-selected={locale === opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(opt.value as Locale);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation
                    ${isRtl ? "text-right" : "text-left"}
                    ${locale === opt.value
                      ? "bg-[#8b6914]/10 text-[#8b6914]"
                      : "text-[#2c2a26] hover:bg-[#faf8f5]"}`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg
          bg-white text-[#2c2a26] font-medium text-xs sm:text-sm
          border border-[#e8e4dd] shadow-sm hover:shadow-md transition-shadow touch-manipulation"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("map.chooseLanguage", locale)}
        dir="ltr"
      >
        <Languages className="w-4 h-4 text-[#8b6914]" aria-hidden="true" />
        <span>{current.label}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {panel}
    </>
  );
}
