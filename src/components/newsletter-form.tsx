"use client";

import { useState } from "react";
import { useT } from "@/lib/use-t";

/** Demo only: the address is validated by the browser and then discarded. Nothing is sent or stored. */
export default function NewsletterForm() {
  const t = useT();
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p role="status" className="mt-8 text-sm leading-relaxed text-obsidian/70">
        {t("Thank you. This is a demo storefront, so your address was not sent or stored.")}
      </p>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="mx-auto mt-8 flex w-full max-w-md items-stretch"
    >
      <label htmlFor="newsletter-email" className="sr-only">{t("Email address")}</label>
      <input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        placeholder={t("Your email address")}
        className="min-w-0 flex-1 bg-obsidian/[0.04] px-5 py-4 text-sm text-obsidian outline-none transition-colors duration-500 placeholder:text-obsidian/45 focus:bg-obsidian/[0.07]"
      />
      <button type="submit" className="eyebrow bg-obsidian px-8 text-alabaster transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-champagne hover:text-obsidian">
        {t("Join")}
      </button>
    </form>
  );
}
