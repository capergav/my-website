"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { locales, type Locale } from "@/app/lib/translations";

export function LanguageDropdown() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = locales.find((l) => l.value === locale) ?? locales[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-xl bg-black text-white font-medium text-sm touch-manipulation border-2 border-amber-400/90 hover:border-amber-300 shadow-lg"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Change language"
      >
        <span>{current.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full end-0 mt-2 min-w-[10rem] py-1 rounded-xl bg-[var(--card)] border border-[var(--card-border)] shadow-lg z-50"
        >
          {locales.map((opt) => (
            <li key={opt.value} role="option" aria-selected={locale === opt.value}>
              <button
                type="button"
                onClick={() => {
                  setLocale(opt.value as Locale);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                  locale === opt.value
                    ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "text-[var(--foreground)] hover:bg-[var(--card-border)]/50"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
