"use client";

import Link from "next/link";
import { t, tCount } from "@/app/lib/translations";
import { MapView, type MapPin } from "./MapView";
import { MapLanguagePicker } from "./MapLanguagePicker";
import { useMapLocale } from "./useMapLocale";

export function MapClient({ pins }: { pins: MapPin[] }) {
  const { locale, setLocale } = useMapLocale();
  const isRtl = locale === "ar";

  return (
    // RTL is scoped to this wrapper only — never document.documentElement/body,
    // which would bleed into the admin layout.
    <main dir={isRtl ? "rtl" : "ltr"} className="h-[100dvh] flex flex-col bg-[#15120d]">
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#322d26] bg-[#1b1813]">
        <Link href="/" className="flex items-center gap-2 no-underline" dir="ltr">
          <span className="text-lg">
            <span style={{ fontFamily: "Georgia, serif", color: "#f1ebe0", fontWeight: 400 }}>Dine</span>
            <span style={{ fontFamily: "Georgia, serif", color: "#e3c98c", fontWeight: 700 }}>Links</span>
          </span>
          <span className="text-sm text-[#a39d94] font-medium">· {t("map.title", locale)}</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8a847b] hidden sm:inline">
            {tCount(pins.length, "map.countOne", "map.countOther", locale)}
          </span>
          <MapLanguagePicker locale={locale} setLocale={setLocale} />
          <Link href="/map/admin" className="text-xs font-medium text-[#d9b25f] hover:underline">
            {t("map.manage", locale)}
          </Link>
        </div>
      </header>
      <div className="flex-1 relative">
        {pins.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <p className="text-[#a39d94]">
              {t("map.emptyBody", locale)}{" "}
              <Link href="/map/admin" className="text-[#d9b25f] font-medium hover:underline">
                {t("map.manage", locale)}
              </Link>
            </p>
          </div>
        ) : (
          <MapView pins={pins} locale={locale} />
        )}
      </div>
    </main>
  );
}
