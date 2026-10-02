"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { myEnquiries, type MyEnquiry } from "@/app/actions/account";
import { authClient, useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";

const EASE = [0.22, 1, 0.36, 1] as const;
const SIZES = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"];

/** The signed-in customer's drawer: saved ring size, their enquiries and consultation requests, and log out. */
export default function AccountDrawer() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const panel = useStore((s) => s.panel);
  const setPanel = useStore((s) => s.setPanel);
  const { user, session } = useAuth();
  const open = panel === "account" && !!user;
  const [items, setItems] = useState<MyEnquiry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState("");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const token = session?.access_token;

  useEffect(() => {
    if (!open || !token) return;
    setItems(null); setFailed(false);
    myEnquiries(token).then((r) => (r.ok ? setItems(r.items) : setFailed(true)));
    setSize(typeof user?.user_metadata?.ring_size === "string" ? user.user_metadata.ring_size : "");
    setSaved("idle");
  }, [open, token, user?.user_metadata?.ring_size]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, setPanel]);

  async function saveSize(v: string) {
    setSize(v);
    const c = authClient();
    if (!c) return;
    setSaved("saving");
    const { error } = await c.auth.updateUser({ data: { ring_size: v || null } });
    setSaved(error ? "error" : "saved");
  }
  async function logout() {
    await authClient()?.auth.signOut();
    setPanel(null);
  }
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} onClick={() => setPanel(null)} role="dialog" aria-modal="true" aria-label={t("VIP Client")} className="fixed inset-0 z-[70] flex justify-end bg-obsidian/45">
          <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} transition={{ duration: 0.55, ease: EASE }} onClick={(e) => e.stopPropagation()} className="relative flex h-full w-full max-w-[28rem] flex-col overflow-y-auto bg-alabaster p-8 md:p-12">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow text-[0.8rem] text-obsidian">{t("VIP Client")}</h2>
              <button onClick={() => setPanel(null)} aria-label={t("Close")} className="-mr-2 p-2 text-obsidian/60 transition-colors duration-500 hover:text-obsidian">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden><path d="M2 2l12 12M14 2 2 14" /></svg>
              </button>
            </div>
            <p className="mt-8 break-all font-display text-[1.5rem] leading-tight">{user?.email}</p>

            <section className="mt-12" aria-labelledby="acc-size">
              <h3 id="acc-size" className="eyebrow text-[0.62rem] text-obsidian">{t("Saved ring size")}</h3>
              <div className="mt-4 flex items-center gap-4">
                <select value={size} onChange={(e) => saveSize(e.target.value)} aria-labelledby="acc-size" className="border border-charcoal/15 bg-transparent px-3 py-2.5 text-[0.9rem] tabular-nums outline-none focus:border-obsidian">
                  <option value="">{t("Not saved")}</option>
                  {SIZES.map((s) => <option key={s} value={s}>US {s}</option>)}
                </select>
                <span aria-live="polite" className="text-[0.75rem] text-muted-gray">{saved === "saving" ? t("Saving…") : saved === "saved" ? t("Saved") : saved === "error" ? t("Could not save") : ""}</span>
              </div>
            </section>

            <section className="mt-12" aria-labelledby="acc-cons">
              <h3 id="acc-cons" className="eyebrow text-[0.62rem] text-obsidian">{t("Showroom consultations & enquiries")}</h3>
              {failed ? (
                <p className="mt-4 text-[0.85rem] text-muted-gray">{t("We could not load your enquiries right now.")}</p>
              ) : items === null ? (
                <p className="mt-4 text-[0.85rem] text-muted-gray">{t("One moment…")}</p>
              ) : items.length === 0 ? (
                <p className="mt-4 max-w-sm text-[0.85rem] leading-relaxed text-muted-gray">{t("Nothing yet. Enquiries you send from the ring and diamond pages with this email will appear here.")}</p>
              ) : (
                <ul className="mt-4 divide-y divide-charcoal/10 border-y border-charcoal/10">
                  {items.map((i) => (
                    <li key={i.id} className="py-4">
                      <p className="flex items-baseline justify-between gap-4 text-[0.85rem]">
                        <span>{date(i.createdAt)}</span>
                        <span className="eyebrow text-[0.55rem] text-champagne-deep">{i.status}</span>
                      </p>
                      {i.preferredDate && <p className="mt-1 text-[0.8rem] text-obsidian/75">{t("Preferred date")}: {date(i.preferredDate)}</p>}
                      {i.summary && <p className="mt-1 text-[0.8rem] text-muted-gray">{i.summary}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <button onClick={logout} className="eyebrow mt-auto self-start border-b border-obsidian pb-1 pt-16 text-[0.62rem] text-obsidian transition-colors duration-500 hover:border-champagne">{t("Log out")}</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
