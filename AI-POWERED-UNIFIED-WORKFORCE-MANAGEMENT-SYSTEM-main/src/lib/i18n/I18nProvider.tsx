"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
import type { Language, TranslationKeys } from "./index";

function deepMerge<T extends Record<string, unknown>>(fallback: T, source: Record<string, unknown>): T {
  const result: Record<string, unknown> = { ...fallback };

  for (const key of Object.keys(source)) {
    const fallbackVal = fallback[key];
    const sourceVal = source[key];

    if (
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      fallbackVal &&
      typeof fallbackVal === "object" &&
      !Array.isArray(fallbackVal)
    ) {
      result[key] = deepMerge(fallbackVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
    } else if (sourceVal !== undefined && sourceVal !== null && sourceVal !== "") {
      result[key] = sourceVal;
    }
  }

  return result as T;
}

const safeHi: TranslationKeys = deepMerge(en as unknown as Record<string, unknown>, hi as unknown as Record<string, unknown>) as unknown as TranslationKeys;
const safeMr: TranslationKeys = deepMerge(en as unknown as Record<string, unknown>, mr as unknown as Record<string, unknown>) as unknown as TranslationKeys;

const dictionaries: Record<Language, TranslationKeys> = {
  en,
  hi: safeHi,
  mr: safeMr,
};

const localeMap: Record<Language, string> = {
  en: "en-US",
  hi: "hi-IN",
  mr: "mr-IN",
};

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  locale: string;
  formatDate: (value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (timeValue: string | null | undefined) => string;
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
      document.cookie = `${LANGUAGE_STORAGE_KEY}=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }
  };

  const t = useMemo(() => dictionaries[language] || en, [language]);
  const locale = useMemo(() => localeMap[language] || "en-US", [language]);

  const formatDate = useMemo(() => {
    return (value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
      if (!value) return "—";
      const date = typeof value === "string" ? new Date(value.includes("T") ? value : `${value}T00:00:00`) : value;
      if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "—";

      const defaultOptions: Intl.DateTimeFormatOptions = options || {
        month: "short",
        day: "numeric",
        year: "numeric",
      };

      try {
        return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
      } catch {
        return new Intl.DateTimeFormat("en-US", defaultOptions).format(date);
      }
    };
  }, [locale]);

  const formatTime = useMemo(() => {
    return (timeValue: string | null | undefined) => {
      if (!timeValue) return "—";
      const [hours, minutes] = timeValue.split(":");
      if (!hours || !minutes) return timeValue;
      const date = new Date();
      date.setHours(Number(hours), Number(minutes), 0, 0);

      try {
        return new Intl.DateTimeFormat(locale, {
          hour: "numeric",
          minute: "2-digit",
        }).format(date);
      } catch {
        return new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }).format(date);
      }
    };
  }, [locale]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      locale,
      formatDate,
      formatTime,
    }),
    [language, t, locale, formatDate, formatTime],
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
