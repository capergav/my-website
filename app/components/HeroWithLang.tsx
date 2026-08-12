"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { LanguageDropdown } from "./LanguageDropdown";

type HeroWithLangProps = {
  restaurantName?: string;
  heroImageUrl?: string;
  logoUrl?: string;
  restaurantId?: string;
};

export function HeroWithLang({
  restaurantName,
  heroImageUrl,
  logoUrl,
  restaurantId,
}: HeroWithLangProps) {
  const { t } = useLanguage();

  const title = restaurantName || t("hero.title");

  if (!heroImageUrl) {
    return (
      <div className="bg-[var(--card)] border-b border-[var(--card-border)] px-4 py-5 flex items-center justify-between gap-3">
        <h1
          className="font-semibold text-xl text-[var(--foreground)] truncate"
          style={{ animation: "heroFadeUp 0.4s ease-out both" }}
        >
          {title}
        </h1>
        <div className="flex-shrink-0">
          <LanguageDropdown />
        </div>
        <style>{`
          @keyframes heroFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce) { @keyframes heroFadeUp { from { opacity: 1; } } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative h-36 sm:h-48 md:h-64 lg:h-80 overflow-hidden">
      <img
        src={heroImageUrl}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--background-color, #000000) 0%, rgba(0,0,0,0.35) 45%, transparent 100%)' }} />
      <div className="absolute top-4 end-4 sm:top-5 sm:end-5 z-10">
        <LanguageDropdown />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 text-center">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${title} logo`}
            className="h-16 lg:h-20 w-auto object-contain drop-shadow-xl mx-auto mb-2"
          />
        )}
        <h1
          className={`font-semibold tracking-wide drop-shadow-lg ${logoUrl ? "text-2xl lg:text-3xl" : "text-4xl sm:text-5xl lg:text-6xl"}`}
          style={{ color: "var(--title, #ffffff)", animation: "heroFadeUp 0.4s ease-out both" }}
        >
          {title}
        </h1>
      </div>
      <style>{`
        @keyframes heroFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { @keyframes heroFadeUp { from { opacity: 1; } } }
      `}</style>
    </div>
  );
}
