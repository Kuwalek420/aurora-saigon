"use client";

import { useT } from "@/lib/use-t";

/** Translated text for server components: `<T>Sign Up For Newsletter</T>`. The child string is the English key. */
export function T({ children, vars }: { children: string; vars?: Record<string, string | number> }) {
  const t = useT();
  return <>{t(children, vars)}</>;
}
