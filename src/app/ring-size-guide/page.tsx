import type { Metadata } from "next";
import guide from "@/data/size-guide.json";
import SiteShell from "@/components/site-shell";
import SizeFinder from "@/components/size-finder";
import BookViewingButton from "@/components/book-viewing-button";
import LoopVideo from "@/components/loop-video";
import LangSwitch from "@/components/lang-switch";
import { T } from "@/components/t";
import { guideVi } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Ring Size Guide",
  description: "How to measure your ring size at home, with a US, European and UK/AU conversion chart.",
};

const H2 = "font-display text-[clamp(1.8rem,2.8vw,2.5rem)] font-light leading-[1.1]";

function GuideBody({ guide, vi = false }: { guide: typeof import("@/data/size-guide.json"); vi?: boolean }) {
  const [considerHeading, measureHeading, findHeading, convertHeading] = guide.headings;
  const { columns, rows } = guide.table;

  return (
      <main className="bg-alabaster pb-28 pt-36 md:pb-36 md:pt-44">
        <div className="mx-auto max-w-[62rem] px-5 md:px-10">
          <h1 className="font-display text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[1]">{vi ? <>Hướng dẫn <em className="text-champagne-deep">đo size nhẫn</em></> : <>Ring size <em className="text-champagne-deep">guide</em></>}</h1>

          <div className="mt-20 grid gap-20 md:mt-28 md:grid-cols-2 md:gap-24">
            <section>
              <h2 className={H2}>{considerHeading.replace(/\.$/, "")}</h2>
              <ul className="mt-8 space-y-5 leading-[1.8] text-obsidian/65">
                {guide.considerations.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={H2}>{measureHeading.replace(/\.$/, "")}</h2>
              <ol className="mt-8 space-y-6">
                {guide.steps.map((s, i) => (
                  <li key={s} className="flex gap-6 leading-[1.8] text-obsidian/65">
                    <span className="font-display text-[1.6rem] italic leading-none text-champagne-deep tabular-nums">{i + 1}</span>
                    <span>{s.replace("dimmensions", "dimensions")}</span>
                  </li>
                ))}
              </ol>
              {guide.pdf && (
                <a href={guide.pdf} target="_blank" rel="noopener noreferrer" className="eyebrow mt-10 inline-block border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 hover:border-champagne">
                  <T>Download the printable guide (PDF)</T>
                </a>
              )}
            </section>
          </div>

          <section className="mt-28 md:mt-36">
            <h2 className={H2}>{findHeading.replace(/!$/, "")}</h2>
            <p className="mt-6 max-w-lg leading-[1.8] text-obsidian/65"><T>Enter the inside diameter of a ring that fits, and we will find the nearest size.</T></p>
            <div className="mt-10">
              <SizeFinder columns={columns} rows={rows} label="Internal diameter" />
            </div>
          </section>

          <section className="mt-28 md:mt-36">
            <h2 className={H2}>{convertHeading.replace(/\?$/, "")}</h2>
            {guide.conversionNote && <p className="mt-6 max-w-lg leading-[1.8] text-obsidian/65">{guide.conversionNote}</p>}
            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left tabular-nums">
                <caption className="sr-only"><T>Ring size conversion by internal diameter</T></caption>
                <thead>
                  <tr className="eyebrow text-[0.58rem] text-muted-gray">
                    {columns.map((c) => (
                      <th key={c} scope="col" className="pb-5 pr-6 font-medium"><T>{c}</T></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r[0]} className="border-t border-charcoal/10">
                      {r.map((cell, i) => (
                        <td key={i} className={`py-4 pr-6 ${i === 1 ? "font-display text-[1.5rem] text-obsidian" : "text-obsidian/70"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-28 md:mt-36">
            <h2 className={H2}><T>Carat size on a real hand</T></h2>
            <p className="mt-6 max-w-lg leading-[1.8] text-obsidian/70"><T>Oval cut stones from 0.75 ct to 4 ct, with their dimensions, shown on a real hand.</T></p>
            <div className="mt-10 max-w-xl">
              <LoopVideo src="/assets/showroom/carat-size-gauge.mp4" poster="/assets/showroom/carat-size-gauge-poster.jpg" label="A carat size gauge on a real hand: oval stones from 0.75 ct to 4 ct, each labelled with its dimensions" />
            </div>
          </section>

          <div className="mt-28 text-center md:mt-36">
            <p className="font-display text-[clamp(1.5rem,2.4vw,2.1rem)] font-light leading-snug text-obsidian/80"><T>Not sure? We will size you in person.</T></p>
            <BookViewingButton className="eyebrow mt-10 border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne" />
          </div>
        </div>
      </main>
  );
}

export default function RingSizeGuidePage() {
  return (
    <SiteShell>
      <LangSwitch en={<GuideBody guide={guide} />} vi={<GuideBody guide={guideVi} vi />} />
    </SiteShell>
  );
}
