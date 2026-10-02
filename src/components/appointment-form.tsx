"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/use-t";

const INTERESTS = ["Engagement Ring", "Custom Design", "Wedding Bands", "Ready to Ship Pick-up"] as const;

const LABEL = "eyebrow block text-[0.58rem] text-muted-gray";
const FIELD = "mt-1 w-full border-b border-charcoal/20 bg-transparent py-3 text-[0.95rem] text-obsidian outline-none transition-colors duration-500 placeholder:text-obsidian/35 focus:border-champagne";

/** Private appointment request. Demo only: validated by the browser, then discarded; nothing is sent or stored. */
export default function AppointmentForm({ hours }: { hours: string }) {
  const t = useT();
  const [sent, setSent] = useState<string | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  if (sent) {
    return (
      <div role="status" className="py-4">
        <h3 className="font-display text-[2rem] font-light leading-tight">{t("Thank you, {name}.", { name: sent })}</h3>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-obsidian/70">
          {t("This is a demo storefront, so your appointment request was not sent or stored. To arrange a real visit, call or email us using the details beside this form ({hours}).", { hours })}
        </p>
        <button onClick={() => setSent(null)} className="eyebrow mt-8 border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 hover:border-champagne">
          {t("Make another request")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
        setSent(name.split(" ")[0] || t("and welcome"));
      }}
      className="space-y-8"
    >
      <div>
        <label htmlFor="ap-name" className={LABEL}>{t("Name")}</label>
        <input id="ap-name" name="name" required autoComplete="name" className={FIELD} />
      </div>
      <div>
        <label htmlFor="ap-email" className={LABEL}>{t("Email")}</label>
        <input id="ap-email" name="email" type="email" required autoComplete="email" className={FIELD} />
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="ap-date" className={LABEL}>{t("Preferred date")}</label>
          <input id="ap-date" name="date" type="date" required min={today} className={FIELD} />
        </div>
        <div>
          <label htmlFor="ap-time" className={LABEL}>{t("Preferred time")}</label>
          <input id="ap-time" name="time" type="time" required min="10:30" max="19:30" step={1800} className={FIELD} />
        </div>
      </div>
      <div>
        <label htmlFor="ap-interest" className={LABEL}>{t("Interest")}</label>
        <select id="ap-interest" name="interest" required defaultValue="" className={FIELD}>
          <option value="" disabled>{t("Select an interest")}</option>
          {INTERESTS.map((i) => (
            <option key={i} value={i}>{t(i)}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="eyebrow w-full bg-obsidian py-5 text-alabaster transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-champagne hover:text-obsidian">
        {t("Confirm Appointment")}
      </button>
      <p className="text-[0.75rem] leading-relaxed text-muted-gray">{t("Demo storefront: nothing you enter here is sent or stored.")}</p>
    </form>
  );
}
