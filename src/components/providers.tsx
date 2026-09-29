"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { LiveTranslate } from "./live-translate";

type I18n = { locale: Locale; t: Dictionary };
const I18nContext = createContext<I18n | null>(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <Providers>");
  return ctx;
}

export function Providers({ locale, t, children }: I18n & { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Offline support is an enhancement; the site works without it.
    });
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
      <LiveTranslate locale={locale} />
    </I18nContext.Provider>
  );
}
