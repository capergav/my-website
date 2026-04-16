"use client";

import { useState, useRef, useEffect, useCallback, type CSSProperties } from "react";
import ReactDOM from "react-dom";
import { useLanguage } from "@/app/context/LanguageContext";
import { locales, type Locale } from "@/app/lib/translations";

export function LanguageDropdown() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLUListElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        popupRef.current  && !popupRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Position popup with fixed coords so sticky headers never clip it
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const W = window.innerWidth;
    const isRtl = document.documentElement.dir === "rtl";
    const minWidth = Math.max(rect.width, 160);

    if (isRtl) {
      // Anchor to the left edge of the button, clamp so it doesn't overflow the right side
      setPopupStyle({
        position: "fixed",
        top:      rect.bottom + 8,
        left:     Math.min(rect.left, W - minWidth - 8),
        minWidth,
        zIndex:   99999,
      });
    } else {
      // Anchor to the right edge of the button, clamp so it doesn't overflow the left side
      setPopupStyle({
        position: "fixed",
        top:      rect.bottom + 8,
        right:    Math.max(8, W - rect.right),
        minWidth,
        zIndex:   99999,
      });
    }
  }, []);

  const handleToggle = () => {
    if (!open) calculatePosition();
    setOpen((o) => !o);
  };

  const current = locales.find((l) => l.value === locale) ?? locales[0];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl font-medium text-sm touch-manipulation border shadow-sm transition-opacity hover:opacity-80"
        style={{
          background:  "var(--foreground)",
          color:       "var(--background)",
          borderColor: "var(--accent)",
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Change language"
      >
        <span>{current.label}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && ReactDOM.createPortal(
        <ul
          ref={popupRef}
          role="listbox"
          style={{ ...popupStyle, animation: 'dropIn 0.12s ease-out' }}
          className="py-1 rounded-xl bg-[var(--card)] border border-[var(--card-border)] shadow-2xl overflow-hidden"
        >
          {locales.map((opt) => (
            <li key={opt.value} role="option" aria-selected={locale === opt.value}>
              <button
                type="button"
                onClick={() => { setLocale(opt.value as Locale); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation ${
                  locale === opt.value
                    ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "text-[var(--foreground)] hover:bg-[var(--card-border)]/50"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </>
  );
}
