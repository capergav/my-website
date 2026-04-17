"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { LanguageDropdown } from "./LanguageDropdown";

type HeroWithLangProps = {
  restaurantName?: string;
  heroImageUrl?: string;
  logoUrl?: string;
};

export function HeroWithLang({
  restaurantName,
  heroImageUrl,
  logoUrl,
}: HeroWithLangProps) {
  const { t } = useLanguage();

  const title = restaurantName || t("hero.title");
  const imageSrc =
    heroImageUrl ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5";

  return (
    <div className="relative h-72 lg:h-80 overflow-hidden">
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
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
          className={`font-serif font-semibold text-white tracking-wide drop-shadow-lg ${logoUrl ? "text-2xl lg:text-3xl" : "text-4xl sm:text-5xl lg:text-6xl"}`}
          style={{ animation: "heroFadeUp 0.4s ease-out both" }}
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
