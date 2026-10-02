"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { submitInquiry } from "@/app/actions/inquiry";
import { siteConfig } from "@/data/site-config";
import { useT } from "@/lib/use-t";

const LABEL = "eyebrow block text-[0.58rem] text-muted-gray";
const FIELD = "mt-1 w-full border-b border-charcoal/20 bg-transparent py-3 text-[0.95rem] text-obsidian outline-none transition-colors duration-500 placeholder:text-obsidian/45 focus:border-champagne";

/**
 * Enquiry form for the custom-ring builder and the diamond pages. Unlike the demo forms elsewhere on this site, this one is
 * really sent: it is stored as a "New Inquiry" for the showroom team (see app/actions/inquiry.ts), and says so.
 */
export default function InquiryForm({ context, submitLabel, onDone }: { context: string; submitLabel?: string; onDone?: () => void }) {
  const t = useT();
  const uid = useId();
  const [shownAt, setShownAt] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", email: "", phone: "", date: "", message: "", consent: false, website: "" });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  useEffect(() => setShownAt(Date.now()), []);
  const set = (k: "name" | "email" | "phone" | "date" | "message" | "website") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError(null);
    const res = await submitInquiry({ name: f.name, email: f.email, phone: f.phone, preferredDate: f.date, message: f.message, context, consent: f.consent, website: f.website, shownAt });
    if (res.ok) setState("sent");
    else { setState("idle"); setError(res.error); }
  };

  if (state === "sent") {
    return (
      <div role="status" className="py-4">
        <h3 className="font-display text-[2rem] font-light leading-tight">{t("Thank you, {name}.", { name: f.name.split(" ")[0] })}</h3>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-obsidian/70">{t("Your enquiry has reached our showroom team. We will reply by email or phone.")}</p>
        {onDone && <button onClick={onDone} className="eyebrow mt-8 border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 hover:border-champagne">{t("Close")}</button>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-7" noValidate={false}>
      <div>
        <label htmlFor={`${uid}-name`} className={LABEL}>{t("Full name")}</label>
        <input id={`${uid}-name`} required autoComplete="name" maxLength={120} value={f.name} onChange={set("name")} className={FIELD} />
      </div>
      <div className="grid gap-7 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-email`} className={LABEL}>{t("Email")}</label>
          <input id={`${uid}-email`} type="email" autoComplete="email" maxLength={200} value={f.email} onChange={set("email")} className={FIELD} />
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={LABEL}>{t("Phone")}</label>
          <input id={`${uid}-phone`} type="tel" autoComplete="tel" maxLength={40} value={f.phone} onChange={set("phone")} className={FIELD} />
        </div>
      </div>
      <p className="-mt-3 text-[0.72rem] text-muted-gray">{t("Email or phone, so we can reply.")}</p>
      <div>
        <label htmlFor={`${uid}-date`} className={LABEL}>{t("Preferred showroom visit (optional)")}</label>
        <input id={`${uid}-date`} type="date" min={today} value={f.date} onChange={set("date")} className={FIELD} />
      </div>
      <div>
        <label htmlFor={`${uid}-msg`} className={LABEL}>{t("Anything we should know (optional)")}</label>
        <textarea id={`${uid}-msg`} rows={3} maxLength={1500} value={f.message} onChange={set("message")} className={`${FIELD} resize-none`} />
      </div>

      {/* honeypot: invisible to people, tempting to bots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label>
      </div>

      <label className="flex items-start gap-3 text-[0.78rem] leading-relaxed text-obsidian/75">
        <input type="checkbox" checked={f.consent} onChange={(e) => setF((s) => ({ ...s, consent: e.target.checked }))} required className="mt-1 h-4 w-4 shrink-0 accent-obsidian" />
        <span>{t("I agree that Aurora Saigon may contact me about this enquiry and keep these details to reply to it.")}</span>
      </label>
      <p className="text-[0.72rem] leading-relaxed text-muted-gray">
        {t("Unlike the demo forms elsewhere on this site, this enquiry is sent to our team and stored so we can reply. You can also email {email} or call {phone}.", { email: siteConfig.brand.email, phone: siteConfig.brand.phone })}
      </p>

      <AnimatePresence>
        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alert" className="text-[0.85rem] text-obsidian">{error}</motion.p>}
      </AnimatePresence>
      <button type="submit" disabled={state === "sending"} className="eyebrow w-full bg-obsidian py-5 text-alabaster transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-champagne hover:text-obsidian disabled:opacity-50">
        {state === "sending" ? t("Sending") : submitLabel ?? t("Send enquiry")}
      </button>
    </form>
  );
}

/** The same form in a dialog, for "Enquire about this stone" buttons. */
export function InquiryDialog({ open, title, summary, context, onClose }: { open: boolean; title: string; summary?: string; context: string; onClose: () => void }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} onClick={onClose} role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[70] flex items-center justify-center bg-obsidian/45 p-4">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()} className="relative max-h-[92dvh] w-full max-w-[30rem] overflow-y-auto bg-alabaster p-8 md:p-10">
            <h3 className="font-display text-[1.9rem] font-normal leading-[1.1]">{title}</h3>
            {summary && <p className="mt-3 text-[0.85rem] leading-relaxed text-obsidian/70">{summary}</p>}
            <div className="mt-8"><InquiryForm context={context} onDone={onClose} /></div>
            <button onClick={onClose} className="eyebrow absolute right-6 top-6 text-[0.58rem] text-muted-gray transition-colors hover:text-obsidian">{t("Close")}</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
