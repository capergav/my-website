"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import type { CSSProperties } from "react";

export function MenuDirWrapper({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  const { locale } = useLanguage();
  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} style={style}>
      {children}
    </div>
  );
}
