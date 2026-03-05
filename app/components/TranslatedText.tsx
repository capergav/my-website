"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { useTranslated } from "@/app/hooks/useTranslated";

type Props = {
  text: string;
  className?: string;
  as?: "span" | "p" | "div";
};

export function TranslatedText({ text, className, as: Tag = "span" }: Props) {
  const { locale } = useLanguage();
  const { value } = useTranslated(text, locale);
  return <Tag className={className}>{value || text}</Tag>;
}
