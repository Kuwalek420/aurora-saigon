"use client";

import { useState } from "react";
import { useT } from "@/lib/use-t";

type Row = string[];

/** "Tell me my size": nearest row of the conversion table for a measured internal diameter. */
export default function SizeFinder({ columns, rows, label }: { columns: string[]; rows: Row[]; label: string }) {
  const t = useT();
  const [value, setValue] = useState("");
  const mm = parseFloat(value.replace(",", "."));
  const valid = Number.isFinite(mm) && mm > 0;
  const nearest = valid ? rows.reduce((best, r) => (Math.abs(parseFloat(r[0]) - mm) < Math.abs(parseFloat(best[0]) - mm) ? r : best)) : null;
  const outOfRange = valid && nearest && Math.abs(parseFloat(nearest[0]) - mm) > 1.2;

  return (
    <div className="max-w-xl">
      <label htmlFor="diameter" className="eyebrow block text-[0.6rem] text-muted-gray">{t(label)} (mm)</label>
      <input
        id="diameter"
        inputMode="decimal"
        autoComplete="off"
        maxLength={5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="17.3"
        className="mt-2 w-40 border-b border-charcoal/25 bg-transparent py-2.5 text-lg tabular-nums outline-none transition-colors duration-500 placeholder:text-obsidian/30 focus:border-champagne"
      />
      <div aria-live="polite" className="mt-8 min-h-[4.5rem]">
        {nearest && !outOfRange && (
          <dl className="flex gap-10">
            {[[columns[1], nearest[1]], [columns[2], nearest[2]], [columns[3], nearest[3]]].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow mb-2 text-[0.55rem] text-muted-gray">{t(k)}</dt>
                <dd className="font-display text-[2rem] leading-none tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {outOfRange && <p className="text-sm text-muted-gray">{t("That is outside our chart ({a} to {b} mm). Please re-measure the inside of the ring.", { a: rows[0][0], b: rows[rows.length - 1][0] })}</p>}
      </div>
    </div>
  );
}
