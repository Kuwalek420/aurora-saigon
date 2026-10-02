"use client";

import { useStore } from "@/lib/store";

/** Server pages render both languages; this shows the one the visitor chose (English until the stored choice loads). */
export default function LangSwitch({ en, vi }: { en: React.ReactNode; vi: React.ReactNode }) {
  const lang = useStore((s) => s.lang);
  return <>{lang === "vi" ? vi : en}</>;
}
