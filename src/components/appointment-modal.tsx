"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";
import { productName } from "@/lib/localize";

const EASE = [0.22, 1, 0.36, 1] as const;

const FIELD = "mt-1 w-full border-b border-charcoal/20 bg-transparent py-2.5 text-[0.95rem] text-obsidian outline-none transition-colors duration-500 placeholder:text-obsidian/60 focus:border-champagne";
const LABEL = "eyebrow block text-[0.58rem] text-muted-gray";

function Form({ onClose }: { onClose: () => void }) {
  const product = useStore((s) => s.viewing.product);
  const lang = useStore((s) => s.lang);
  const t = useT();
  const pName = product ? productName(product, lang) : "";
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ name: "", contact: "", date: "", time: "", note: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} transition={{ duration: 0.6, ease: EASE }} onClick={(e) => e.stopPropagation()} className="relative max-h-[92dvh] w-full max-w-[30rem] overflow-y-auto bg-alabaster p-8 md:p-10" data-lenis-prevent>
      {sent ? (
        <div className="py-6 text-center">
          <h3 className="font-display text-[2.2rem] font-normal leading-tight">{t("Thank you, {name}.", { name: f.name.split(" ")[0] || t("and welcome") })}</h3>
          <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-obsidian/60">
            {t("This storefront is a demonstration, so your request was not transmitted or stored. In the live site this would reach the Thao Dien showroom team to confirm a time with you.")}
          </p>
          <dl className="mx-auto mt-7 max-w-xs space-y-2 border-t border-charcoal/10 pt-6 text-left text-[0.8rem]">
            {product && <div className="flex justify-between gap-4"><dt className="text-muted-gray">{t("Piece")}</dt><dd className="text-right">{pName}</dd></div>}
            {f.date && <div className="flex justify-between gap-4"><dt className="text-muted-gray">{t("Preferred date")}</dt><dd>{f.date}</dd></div>}
            {f.time && <div className="flex justify-between gap-4"><dt className="text-muted-gray">{t("Preferred time")}</dt><dd>{f.time}</dd></div>}
          </dl>
          <button onClick={onClose} className="eyebrow mt-9 bg-obsidian px-10 py-4 text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian">{t("Close")}</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <h3 className="font-display text-[2rem] font-normal leading-[1.1]">{t("Visit us in Thao Dien")}</h3>
          <p className="mt-4 text-[0.85rem] leading-relaxed text-obsidian/60">{t("See the piece in person, sit with a designer and hold the stones before you decide.")}</p>
          {product && <p className="mt-5 border-l border-champagne pl-4 text-[0.85rem]"><span className="eyebrow mr-2 text-[0.55rem] text-muted-gray">{t("Interested in")}</span>{pName}</p>}

          <div className="mt-8 space-y-6">
            <label className="block"><span className={LABEL}>{t("Full name")}</span><input required autoComplete="name" value={f.name} onChange={set("name")} className={FIELD} placeholder={t("Your name")} /></label>
            <label className="block"><span className={LABEL}>{t("Email or phone")}</span><input required autoComplete="email" value={f.contact} onChange={set("contact")} className={FIELD} placeholder={t("So we can confirm your time")} /></label>
            <div className="grid grid-cols-2 gap-6">
              <label className="block"><span className={LABEL}>{t("Preferred date")}</span><input required type="date" min={today} value={f.date} onChange={set("date")} className={FIELD} /></label>
              <label className="block"><span className={LABEL}>{t("Preferred time")}</span><input required type="time" value={f.time} onChange={set("time")} className={FIELD} /></label>
            </div>
            <label className="block"><span className={LABEL}>{t("Anything we should prepare (optional)")}</span><textarea rows={2} value={f.note} onChange={set("note")} className={`${FIELD} resize-none`} placeholder={t("Ring size, budget, occasion")} /></label>
          </div>

          <p className="mt-6 text-[0.68rem] leading-relaxed text-muted-gray">{t("Demo form: nothing is sent anywhere. Please don’t enter real personal details.")}</p>
          <div className="mt-7 flex gap-3">
            <button type="button" onClick={onClose} className="eyebrow flex-1 border border-charcoal/20 py-4 transition-colors duration-500 hover:border-obsidian/50">{t("Cancel")}</button>
            <button type="submit" className="eyebrow flex-[2] bg-obsidian py-4 text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian">{t("Request viewing")}</button>
          </div>
        </form>
      )}
    </motion.div>
  );
}

export default function AppointmentModal() {
  const t = useT();
  const open = useStore((s) => s.viewing.open);
  const close = useStore((s) => s.closeViewing);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="viewing"
          role="dialog"
          aria-modal="true"
          aria-label={t("Book a private viewing")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          onClick={close}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-obsidian/45 p-4 backdrop-blur-xl"
        >
          <Form onClose={close} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
