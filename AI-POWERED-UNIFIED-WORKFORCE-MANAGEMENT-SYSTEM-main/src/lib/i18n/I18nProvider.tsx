"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
import type { Language, TranslationKeys } from "./index";

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
};

const dictionaries: Record<Language, TranslationKeys> = {
  en,
  hi,
  mr,
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "workforce_lang";

export function I18nProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      if (saved && (saved === "en" || saved === "hi" || saved === "mr")) {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    return "en";
  });

  const setLanguage = (nextLang: Language) => {
    setLanguageState(nextLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
      document.cookie = `${LANGUAGE_STORAGE_KEY}=${nextLang}; path=/; max-age=31536000`;
    } catch {
      // Ignore storage errors
    }
  };

  const t = useMemo(() => dictionaries[language] || en, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}
