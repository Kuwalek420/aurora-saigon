"use client";

import { useState } from "react";
import { saveAnnouncement } from "./actions";
import type { Api } from "./dashboard";

export default function BannerTab({ api, initial }: { api: Api; initial: { enabled: boolean; message: string; link: string } }) {
  const [saved, setSaved] = useState(initial);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState(initial.message);
  const [link, setLink] = useState(initial.link);
  const [busy, setBusy] = useState(false);
  const dirty = enabled !== saved.enabled || message.trim() !== saved.message || link.trim() !== saved.link;

  const save = async () => {
    setBusy(true);
    const res = await saveAnnouncement(enabled, message, link);
    setBusy(false);
    if (res.ok) {
      setSaved({ enabled: res.enabled, message: res.message, link: res.link });
      setMessage(res.message);
      setLink(res.link);
      api.toast(res.enabled ? "Announcement bar is live" : "Announcement bar is off");
    } else api.toast(res.error, "error");
  };

  return (
    <section className="mt-8 max-w-2xl">
      <h2 className="font-display text-2xl">Announcement bar</h2>
      <p className="mt-2 text-[0.8rem] leading-relaxed text-muted-gray">A thin bar across the top of every page, above the menu. Changes reach the storefront within a minute.</p>

      <button onClick={() => setEnabled((e) => !e)} role="switch" aria-checked={enabled} className="mt-8 flex items-center gap-3 py-2 text-left">
        <span className={`relative block h-6 w-11 shrink-0 border transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${enabled ? "border-obsidian bg-obsidian" : "border-charcoal/30"}`}>
          <span className={`absolute top-[3px] block h-4 w-4 transition-[left,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${enabled ? "left-[23px] bg-alabaster" : "left-[3px] bg-charcoal/50"}`} />
        </span>
        <span className="text-base">{enabled ? "Showing the bar" : "Bar is off"}</span>
      </button>

      <label className="mt-6 block text-[0.8rem] text-muted-gray">Message
        <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} placeholder="5% Showroom Discount this Weekend" className="mt-2 block w-full border-b border-charcoal/30 bg-transparent py-3 text-base text-obsidian outline-none transition-colors duration-500 focus:border-obsidian" />
        <span className="mt-1 block text-right text-[0.7rem] tabular-nums">{message.length}/200</span>
      </label>

      <label className="mt-6 block text-[0.8rem] text-muted-gray">Link (optional)
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/showroom" className="mt-2 block w-full border-b border-charcoal/30 bg-transparent py-3 text-base text-obsidian outline-none transition-colors duration-500 focus:border-obsidian" />
        <span className="mt-1 block text-[0.7rem]">A page on this site such as /showroom, or an https:// address. Leave empty for plain text.</span>
      </label>

      <p className="mt-6 text-[0.75rem] text-muted-gray">Preview</p>
      <div className="mt-2 border border-charcoal/10">
        {enabled && message.trim() ? <p className={`bg-obsidian px-5 py-2 text-center text-[0.72rem] leading-snug tracking-[0.04em] text-alabaster ${link.trim() ? "underline decoration-alabaster/40 underline-offset-[5px]" : ""}`}>{message.trim()}</p> : <p className="px-5 py-2 text-center text-[0.72rem] text-muted-gray">No bar is shown.</p>}
      </div>

      <button onClick={() => void save()} disabled={!dirty || busy} className="eyebrow mt-8 bg-obsidian px-10 py-5 text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian disabled:opacity-40 disabled:hover:bg-obsidian disabled:hover:text-alabaster">{busy ? "Saving" : "Save banner"}</button>
    </section>
  );
}
