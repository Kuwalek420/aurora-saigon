"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { siteConfig } from "@/data/site-config";
import { chainLabel, formatMoney, METAL_LABEL, subtitle, unitPrice, useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";
import { pipeSubtitleFor, productDescription, productName } from "@/lib/localize";

type Pay = null | "vietqr" | "card";

function PaymentModal({ mode, totalVnd, onClose, onDone }: { mode: Exclude<Pay, null>; totalVnd: number; onClose: () => void; onDone: () => void }) {
  const currency = useStore((s) => s.currency);
  const t = useT();
  const [qr, setQr] = useState("");
  const [paid, setPaid] = useState(false);
  const ref = useMemo(() => "AS" + Math.random().toString(36).slice(2, 8).toUpperCase(), []);

  useEffect(() => {
    if (mode !== "vietqr") return;
    // Mock payload only: this is NOT a real VietQR/EMVCo string and cannot move money.
    QRCode.toDataURL(`AURORA-SAIGON-DEMO|REF:${ref}|AMOUNT_VND:${totalVnd}`, { margin: 1, width: 360, color: { dark: "#0D0E0E", light: "#F4F0EB" } }).then(setQr);
  }, [mode, ref, totalVnd]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/70 p-4 backdrop-blur-xl" onClick={onClose} role="dialog" aria-modal="true" aria-label={mode === "vietqr" ? t("VietQR payment") : t("Card payment")}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md border border-charcoal/10 bg-alabaster p-8 text-obsidian">
        {paid ? (
          <div className="py-8 text-center">
            <h3 className="font-display text-4xl font-light">{t("Thank you.")}</h3>
            <p className="mt-4 text-sm text-obsidian/60">{t("Order {ref} was simulated. No payment was taken.", { ref })}</p>
            <button onClick={onDone} className="eyebrow mt-8 bg-obsidian px-8 py-3.5 text-alabaster hover:bg-champagne hover:text-obsidian">{t("Close")}</button>
          </div>
        ) : mode === "vietqr" ? (
          <>
            <h3 className="font-display text-3xl font-light">{t("Scan to pay")}</h3>
            <div className="mx-auto my-6 flex aspect-square w-56 items-center justify-center border border-charcoal/10 bg-alabaster">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {qr ? <img src={qr} alt={t("Demo QR code")} className="h-full w-full" /> : <span className="text-xs text-muted-gray">{t("Generating…")}</span>}
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-gray">{t("Amount")}</dt><dd className="tabular-nums">{formatMoney(totalVnd, currency)}</dd></div>
              {currency !== "VND" && <div className="flex justify-between"><dt className="text-muted-gray">{t("Charged in")}</dt><dd className="tabular-nums">{formatMoney(totalVnd, "VND")}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted-gray">{t("Reference")}</dt><dd>{ref}</dd></div>
            </dl>
            <p className="mt-5 border border-champagne/40 bg-champagne/10 p-3 text-xs text-obsidian/65">{t("Demo mode: this QR is a placeholder. Connect your bank’s VietQR/NAPAS merchant account to generate live codes.")}</p>
            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="eyebrow flex-1 border border-charcoal/25 py-3.5">{t("Back")}</button>
              <button onClick={() => setPaid(true)} className="eyebrow flex-1 bg-obsidian py-3.5 text-alabaster hover:bg-champagne hover:text-obsidian">{t("I’ve paid (demo)")}</button>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setPaid(true); }}>
            <h3 className="font-display text-3xl font-light">{t("Card payment")}</h3>
            <div className="mt-6 space-y-4">
              {[["Name on card", "name", "cc-name"], ["Card number", "num", "cc-number"]].map(([l, n, a]) => (
                <label key={n} className="block text-[0.62rem] uppercase tracking-[0.24em] text-muted-gray">{t(l)}
                  <input name={n} autoComplete="off" data-demo={a} required className="mt-1 w-full border-b border-charcoal/25 bg-transparent py-2 text-sm normal-case tracking-normal text-obsidian outline-none focus:border-champagne" />
                </label>
              ))}
              <div className="grid grid-cols-2 gap-4">
                {[["Expiry", "MM/YY"], ["CVC", "•••"]].map(([l, ph]) => (
                  <label key={l} className="block text-[0.62rem] uppercase tracking-[0.24em] text-muted-gray">{t(l)}
                    <input placeholder={ph} autoComplete="off" required className="mt-1 w-full border-b border-charcoal/25 bg-transparent py-2 text-sm normal-case tracking-normal text-obsidian outline-none focus:border-champagne" />
                  </label>
                ))}
              </div>
            </div>
            <p className="mt-5 border border-champagne/40 bg-champagne/10 p-3 text-xs text-obsidian/65">{t("Demo mode: nothing is sent anywhere. Do not enter real card details. Wire this step to Alepay’s hosted checkout for live payments.")}</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={onClose} className="eyebrow flex-1 border border-charcoal/25 py-3.5">{t("Back")}</button>
              <button type="submit" className="eyebrow flex-1 bg-obsidian py-3.5 text-alabaster hover:bg-champagne hover:text-obsidian">{t("Pay {amount}", { amount: formatMoney(totalVnd, currency) })}</button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

const WHOLE = ["4", "5", "6", "7", "8", "9"];

/** Shown only after "Direct Buy": the ring size is chosen here, never on the catalog card. */
function SizeStep() {
  const { pending, confirmPending, cancelPending, currency } = useStore();
  const lang = useStore((s) => s.lang);
  const t = useT();
  const [whole, setWhole] = useState<string | null>(null);
  const [half, setHalf] = useState(false);
  if (!pending) return null;
  const { product: p, metal, karat } = pending;
  const size = whole ? (half && whole !== "9" ? `${whole}.5` : whole) : null;
  const img = p.metalImages?.[metal] ?? p.images[0];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="border-b border-charcoal/10 py-7">
      <div className="relative mb-6 aspect-square w-full overflow-hidden bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={`${productName(p, lang)}, ${t(METAL_LABEL[metal])}`} className="absolute inset-0 h-full w-full object-cover mix-blend-multiply" />
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-[1.6rem] font-normal leading-tight">{productName(p, lang)}</p>
        <p className="shrink-0 text-sm tabular-nums">{formatMoney(unitPrice(p, metal, karat ?? undefined), currency)}</p>
      </div>
      <p className="mt-2 text-[12px] uppercase tracking-wider text-muted-gray">{pipeSubtitleFor(subtitle(p, metal, karat), t, lang)}</p>
      {productDescription(p, lang) && <p className="mt-4 text-[0.82rem] leading-relaxed text-obsidian/60">{productDescription(p, lang)}</p>}
      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-charcoal/10 pt-5 text-[0.72rem]">
        {[[t("Metal"), karat ? t("{n}k {metal}", { n: karat, metal: t(METAL_LABEL[metal]) }) : t(METAL_LABEL[metal])], [t("Stone"), t(p.gemstone === "None" ? "None" : /lab[- ]grown diamond/i.test(p.gemstone) ? "Lab Diamond" : p.gemstone)], [t("Carat"), p.carat && p.carat !== "0" ? p.carat : p.stoneSize || "—"]].map(([k, v]) => (
          <div key={k}>
            <dt className="eyebrow mb-1.5 text-[0.55rem] text-muted-gray">{k}</dt>
            <dd className="leading-snug">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="eyebrow mb-4 mt-8 text-[0.62rem] text-champagne-deep">{t("Select your size")}</p>
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow text-[0.58rem] text-muted-gray">{t("Ring size (US)")}</span>
        <button onClick={() => setHalf((h) => !h)} disabled={whole === "9"} aria-pressed={half} className={`eyebrow text-[0.58rem] transition-colors duration-500 disabled:opacity-30 ${half ? "text-champagne-deep" : "text-muted-gray hover:text-obsidian"}`}>{t("+ ½ size")}</button>
      </div>
      <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label={t("Ring size")}>
        {WHOLE.map((w) => {
          const on = whole === w;
          return (
            <button key={w} role="radio" aria-checked={on} onClick={() => setWhole(w)} className={`h-12 border text-sm tabular-nums transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "border-champagne text-champagne-deep" : "border-charcoal/10 text-obsidian/65 hover:border-charcoal/40 hover:text-obsidian"}`}>
              {on && half && w !== "9" ? `${w}½` : w}
            </button>
          );
        })}
      </div>
      <div className="mt-7 flex gap-3">
        <button onClick={cancelPending} className="eyebrow flex-1 border border-charcoal/10 py-4 text-obsidian/70 transition-colors duration-500 hover:border-charcoal/40">{t("Cancel")}</button>
        <button onClick={() => size && confirmPending(size)} disabled={!size} className="eyebrow flex-[2] bg-obsidian py-4 text-alabaster transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-champagne hover:text-obsidian disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-champagne">
          {size ? t("Add size US {size} to bag", { size }) : t("Choose a size")}
        </button>
      </div>
    </motion.div>
  );
}

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, setQty, removeItem, clearCart, currency, pending, lang } = useStore();
  const t = useT();
  const [pay, setPay] = useState<Pay>(null);
  const total = items.reduce((n, i) => n + i.unitVnd * i.qty, 0);
  const hasDiamond = items.some((i) => /diamond/i.test(i.gemstone));

  useEffect(() => {
    if (!drawerOpen) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && !pay && closeDrawer();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [drawerOpen, closeDrawer, pay]);

  return (
    <>
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="fixed inset-0 z-50 bg-obsidian/55 backdrop-blur-xl" />
            <motion.aside key="drawer" role="dialog" aria-modal="true" aria-label={t("Shopping bag")} data-lenis-prevent initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-charcoal/10 bg-alabaster text-obsidian shadow-[-24px_0_60px_-34px_rgba(13,14,14,0.22)]">
              <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-5">
                <h2 className="font-display text-3xl font-light">{t("Your bag")}</h2>
                <button onClick={closeDrawer} className="eyebrow" aria-label={t("Close bag")}>{t("Close")}</button>
              </div>

              <div className="flex-1 overflow-y-auto px-6">
                <AnimatePresence initial={false}><SizeStep key={pending ? pending.product.id + pending.metal : "none"} /></AnimatePresence>
                {items.length === 0 ? (
                  <>{!pending && <p className="font-display py-24 text-center text-2xl text-obsidian/60">{t("Your bag is empty.")}</p>}</>
                ) : (
                  <ul className="divide-y divide-charcoal/10">
                    {items.map((i) => (
                      <li key={i.key} className="flex gap-4 py-5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={i.image} alt="" className="h-24 w-24 shrink-0 bg-cream object-cover mix-blend-multiply" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="font-display text-xl leading-tight">{lang === "vi" && i.titleVi ? i.titleVi : i.title}</p>
                          <p className="mt-1 text-xs text-muted-gray">{i.karat ? t("{n}k {metal}", { n: i.karat, metal: t(METAL_LABEL[i.metal]) }) : t(METAL_LABEL[i.metal])}{i.size ? ` · US ${i.size}` : ""}{i.chain ? ` · ${t("{len} chain", { len: chainLabel(i.chain) })}` : ""}</p>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-charcoal/10 text-sm">
                              <button onClick={() => setQty(i.key, i.qty - 1)} className="px-3 py-1" aria-label={t("Decrease quantity")}><span className="relative block h-2.5 w-2.5" aria-hidden><span className="absolute inset-x-0 top-1/2 h-px bg-current" /></span></button>
                              <span className="w-6 text-center tabular-nums">{i.qty}</span>
                              <button onClick={() => setQty(i.key, i.qty + 1)} className="px-3 py-1" aria-label={t("Increase quantity")}><span className="relative block h-2.5 w-2.5" aria-hidden><span className="absolute inset-x-0 top-1/2 h-px bg-current" /><span className="absolute inset-y-0 left-1/2 w-px bg-current" /></span></button>
                            </div>
                            <p className="tabular-nums text-sm">{formatMoney(i.unitVnd * i.qty, currency)}</p>
                          </div>
                          <button onClick={() => removeItem(i.key)} className="eyebrow mt-2 self-start text-[0.58rem] text-muted-gray underline underline-offset-4">{t("Remove")}</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-4 border-t border-charcoal/10 bg-charcoal/5 px-6 py-6">
                  <div className="flex items-center gap-2 text-xs text-obsidian/65">
                    <span className="eyebrow border border-champagne px-2 py-1 text-[0.58rem] text-champagne-deep">{t("Free")}</span>
                    {t("Insured delivery within Ho Chi Minh City")}
                  </div>
                  <p className="text-xs leading-relaxed text-obsidian/60">
                    {hasDiamond ? t("Diamond pieces are supplied with a GIA or IGI grading certificate.") : t("Gemstone pieces include an authenticity card.")}{" "}
                    {items.some((i) => i.size) && items.some((i) => !i.size)
                      ? t("Rings: {rings}. Fine jewellery: {fine}.", { rings: t(siteConfig.warranty.rings), fine: t(siteConfig.warranty.fineJewellery) })
                      : t("Covered by our {warranty}.", { warranty: t(items.some((i) => i.size) ? siteConfig.warranty.rings : siteConfig.warranty.fineJewellery) })}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow text-muted-gray">{t("Total")}</span>
                    <span className="font-display text-3xl tabular-nums">{formatMoney(total, currency)}</span>
                  </div>
                  <button onClick={() => setPay("vietqr")} className="eyebrow w-full bg-obsidian py-4 text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian">{t("Pay with VietQR")}</button>
                  <button onClick={() => setPay("card")} className="eyebrow w-full border border-charcoal/30 py-4 transition-colors duration-500 hover:border-champagne hover:text-champagne-deep">{t("Credit card / Alepay")}</button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {pay && <PaymentModal key={pay} mode={pay} totalVnd={total} onClose={() => setPay(null)} onDone={() => { setPay(null); clearCart(); closeDrawer(); }} />}
      </AnimatePresence>
    </>
  );
}
