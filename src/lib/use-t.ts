"use client";

import { useCallback } from "react";
import { translate } from "./i18n";
import { useStore } from "./store";

/** `const t = useT(); t("Add to Bag")`. Re-renders the component when the language changes. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
}

/** For content kept as { en, vi } pairs (the landing pages): `const bi = useBi(); bi(CONTENT.title)`. */
export function useBi() {
  const lang = useStore((s) => s.lang);
  return useCallback((b: { en: string; vi: string }) => b[lang], [lang]);
}
