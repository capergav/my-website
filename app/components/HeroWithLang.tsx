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
    <div className="relative h-56 sm:h-64 overflow-hidden">
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute top-4 end-4 sm:top-5 sm:end-5 z-10">
        <LanguageDropdown />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${title} logo`}
            className="h-16 w-auto object-contain drop-shadow-lg mx-auto mb-2"
          />
        )}
        <h1 className={`font-serif font-semibold text-white tracking-wide drop-shadow-lg ${logoUrl ? "text-xl" : "text-4xl sm:text-5xl"}`}>
          {title}
        </h1>
      </div>
    </div>
  );
}
