import { VI } from "./i18n-vi";

export type Lang = "en" | "vi";
export const LANGS: Lang[] = ["en", "vi"];

/** English text is the key. Vietnamese comes from the dictionary; anything not in it falls back to the English, never to nothing. */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const text = lang === "vi" ? VI[key] ?? key : key;
  return vars ? text.replace(/\{(\w+)\}/g, (m: string, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}
