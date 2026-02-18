"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { LanguageDropdown } from "./LanguageDropdown";

export function HeroWithLang() {
  const { t } = useLanguage();

  return (
    <div className="relative h-56 sm:h-64 overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
        alt=""
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute top-4 end-4 sm:top-5 sm:end-5 z-10">
        <LanguageDropdown />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-white tracking-wide drop-shadow-lg px-4 text-center">
          {t("hero.title")}
        </h1>
      </div>
    </div>
  );
}
