"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/app/context/LanguageContext";
import { locales, type Locale } from "@/app/lib/translations";

export function LanguageDropdown() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar";

  useEffect(() => { setMounted(true); }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = window.innerWidth < 640 ? 160 : 180;

    let left: number;
    if (isRtl) {
      // Arabic: align dropdown to LEFT edge of button
      left = rect.left;
    } else {
      // LTR: align dropdown to RIGHT edge of button
      left = rect.right - dropdownWidth;
    }

    // Clamp so it never goes off-screen
    left = Math.max(8, Math.min(left, viewportWidth - dropdownWidth - 8));

    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left,
      width: dropdownWidth,
      zIndex: 99999,
    });
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
    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const current = locales.find((l) => l.value === locale) ?? locales[0];

  const dropdown = open && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      role="listbox"
    >
      <ul
        className="py-1 rounded-xl bg-[var(--card)] border border-[var(--card-border)] shadow-2xl overflow-hidden"
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
              className={`w-full px-4 py-3 text-sm font-medium transition-colors touch-manipulation
                ${isRtl ? "text-right" : "text-left"}
                ${locale === opt.value
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-[var(--foreground)] hover:bg-[var(--card-border)]/50"
                }`}
            >
              {opt.label}
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 min-h-[36px] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl
          bg-[var(--card)] text-[var(--foreground)] font-medium text-xs sm:text-sm
          border border-[var(--card-border)] shadow-sm hover:shadow-md
          transition-shadow touch-manipulation"
        aria-expanded={open}
        aria-haspopup="listbox"
        dir="ltr"
      >
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
      {dropdown}
    </>
  );
}
