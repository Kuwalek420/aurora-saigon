"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";
import { LANGS } from "@/lib/i18n";
import { CURRENCIES, SYMBOL } from "@/lib/currency";
import type { Facets } from "@/lib/products";
import Logo from "./logo";
import Navigation from "./navigation";
import AuthModal from "./auth-modal";
import AccountDrawer from "./account-drawer";
import { useAuth } from "@/lib/auth";
import type { Currency } from "@/lib/types";

export default function Header({ facets, announcement }: { facets: Facets; announcement?: { message: string; link: string | null } }) {
  const { currency, setCurrency, lang, setLang, items, openDrawer, setPanel } = useStore();
  const { user } = useAuth();
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => setMounted(true), []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const count = mounted ? items.reduce((n, i) => n + i.qty, 0) : 0;

  const ink = "text-obsidian";
  const soft = "text-obsidian/60";
  const dim = "text-obsidian/60 hover:text-obsidian";

  return (
    <>
    <header className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${menuOpen ? "border-b border-charcoal/10 bg-alabaster" : "glass"}`}>
      {announcement && (
        <p role="status" className="bg-obsidian px-5 py-2 text-center text-[0.72rem] leading-snug tracking-[0.04em] text-alabaster md:px-10">
          {announcement.link ? <a href={announcement.link} className="underline decoration-alabaster/40 underline-offset-[5px] transition-colors duration-500 hover:decoration-alabaster">{announcement.message}</a> : announcement.message}
        </p>
      )}
      <div className={`mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-5 transition-colors duration-500 md:px-10 ${ink}`}>
        <button onClick={() => (pathname === "/" ? window.scrollTo({ top: 0, behavior: "smooth" }) : router.push("/"))} className="shrink-0 py-2" aria-label={t("Aurora Saigon home")}>
          <Logo />
        </button>
        <Navigation facets={facets} onOpenChange={setMenuOpen} tone={soft} />
        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex items-center gap-1.5 md:gap-2" role="group" aria-label={t("Language")}>
            {LANGS.map((l, i) => (
              <span key={l} className="flex items-center gap-1.5 md:gap-2">
                {i > 0 && <span aria-hidden className="h-3 w-px bg-charcoal/20" />}
                <button onClick={() => setLang(l)} aria-pressed={lang === l} lang={l} className={`eyebrow transition-colors duration-500 max-md:tracking-[0.1em]! ${lang === l ? "text-champagne-deep" : dim}`}>
                  {l.toUpperCase()}
                </button>
              </span>
            ))}
          </div>
          <label className="relative">
            <span className="sr-only">{t("Currency")}</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="eyebrow cursor-pointer appearance-none bg-transparent py-2 pr-4 text-obsidian/80 outline-none transition-colors duration-500 hover:text-obsidian focus-visible:text-obsidian max-md:tracking-[0.06em]!"
            >
              {CURRENCIES.map((c) => <option key={c} value={c} className="text-obsidian">{c} ({SYMBOL[c]})</option>)}
            </select>
            <svg aria-hidden viewBox="0 0 10 6" className="pointer-events-none absolute right-0 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-obsidian/60" fill="none" stroke="currentColor" strokeWidth="1"><path d="m1 1 4 4 4-4" /></svg>
          </label>
          <button
            onClick={() => setPanel(user ? "account" : "login")}
            aria-label={user ? t("VIP Client") : t("Log in")}
            title={user ? t("VIP Client") : t("Log in")}
            className={`relative p-1 transition-colors duration-500 ${user ? "text-champagne-deep" : "text-obsidian/70 hover:text-obsidian"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="8.5" r="3.6" />
              <path d="M4.5 20c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6" />
            </svg>
            {user && <span aria-hidden className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-champagne" />}
          </button>
          <button onClick={openDrawer} className="eyebrow flex items-center gap-2 border border-champagne/60 px-3 py-2 max-md:tracking-[0.1em]! md:px-4 transition-colors duration-500 hover:bg-champagne hover:text-obsidian" aria-label={t("Open cart, {n} items", { n: count })}>
            {t("Bag")} <span className="tabular-nums">{count}</span>
          </button>
        </div>
      </div>
    </header>
    {/* outside the header: its backdrop blur would otherwise become the containing block of these fixed overlays */}
    <AuthModal />
    <AccountDrawer />
    </>
  );
}
