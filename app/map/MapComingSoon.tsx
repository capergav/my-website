"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { t } from "@/app/lib/translations";
import { MapLanguagePicker } from "./MapLanguagePicker";
import { useMapLocale } from "./useMapLocale";

// Public, pre-launch state for /map. Shown to everyone except the founder, so
// it must be fully translated — this is the first thing a non-English diner
// sees. The picker lets them read it in their own language immediately.
export function MapComingSoon() {
  const { locale, setLocale } = useMapLocale();
  const isRtl = locale === "ar";

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-[#faf8f5]">
      <div className={`flex ${isRtl ? "justify-start" : "justify-end"} p-4`}>
        <MapLanguagePicker locale={locale} setLocale={setLocale} />
      </div>
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-[#8b6914] flex items-center justify-center shadow-lg">
            <MapPin width={30} height={30} color="#fff" strokeWidth={2} aria-hidden="true" />
          </div>
          <p className="text-xs font-bold tracking-[0.2em] text-[#8b6914] uppercase mb-3">
            {t("map.comingSoonBadge", locale)}
          </p>
          <h1 className="text-3xl font-serif font-semibold text-[#2c2a26] mb-3">{t("map.title", locale)}</h1>
          <p className="text-[#6b6560] leading-relaxed mb-8">{t("map.comingSoonBody", locale)}</p>
          <Link
            href="/"
            className="inline-block rounded-xl px-5 py-2.5 text-sm font-medium bg-[#8b6914] text-white hover:opacity-90 transition-opacity"
          >
            {t("map.backToHome", locale)}
          </Link>
        </div>
      </div>
    </main>
  );
}
