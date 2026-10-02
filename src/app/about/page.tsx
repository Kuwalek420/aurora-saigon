import type { Metadata } from "next";
import about from "@/data/about.json";
import SiteShell from "@/components/site-shell";
import BookViewingButton from "@/components/book-viewing-button";
import LangSwitch from "@/components/lang-switch";
import { aboutVi } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Why Aurora Saigon was founded on trust rather than salesmanship, how bespoke jewellery is made, and what we believe.",
};

type Section = (typeof about.sections)[number];

function Block({ s, flip }: { s: Section; flip: boolean }) {
  return (
    <section className="grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-24">
      {s.image && (
        <figure className={flip ? "md:order-2" : ""}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image.src} alt={s.image.alt} loading="lazy" className="aspect-[4/5] w-full object-cover" />
        </figure>
      )}
      <div className={flip ? "md:order-1" : ""}>
        <h2 className="font-display text-[clamp(2rem,3.4vw,3.2rem)] font-light leading-[1.08]">{s.heading}</h2>
        <div className="mt-8 max-w-lg space-y-5 leading-[1.8] text-obsidian/65">
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutBody({ about, vi }: { about: typeof import("@/data/about.json"); vi: boolean }) {
  const [intro, ...rest] = about.sections;
  const believe = rest.find((s) => "values" in s && s.values);
  const stories = rest.filter((s) => s !== believe);
  const values = (believe as (Section & { values?: { title: string; text: string }[] }) | undefined)?.values ?? [];

  return (
      <main className="bg-alabaster pb-28 pt-36 md:pb-36 md:pt-44">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <h1 className="font-display text-[clamp(3rem,7vw,6.5rem)] font-light leading-[0.98]">{vi ? <>Câu Chuyện Của <em className="text-champagne-deep">Chúng Tôi</em></> : <>Our <em className="text-champagne-deep">Story</em></>}</h1>

          <div className="mt-14 md:mt-20">
            {intro.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={intro.image.src} alt={vi ? "Boutique Aurora Saigon tại Thảo Điền, TP. Hồ Chí Minh" : "The Aurora Saigon boutique in Thảo Điền, Ho Chi Minh City"} className="aspect-[16/9] w-full object-cover" />
            )}
            <div className="mx-auto mt-14 max-w-2xl text-center md:mt-20">
              <h2 className="font-display text-[clamp(2rem,3.4vw,3.2rem)] font-light leading-[1.08]">{intro.heading}</h2>
              <div className="mt-8 space-y-5 text-left leading-[1.8] text-obsidian/65 md:text-center">
                {intro.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-28 space-y-28 md:mt-36 md:space-y-36">
            {stories.map((s, i) => (
              <Block key={s.id} s={s} flip={i % 2 === 1} />
            ))}
          </div>

          {believe && (
            <section className="mt-28 md:mt-36">
              {believe.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={believe.image.src} alt={believe.image.alt} loading="lazy" className="aspect-[16/9] w-full object-cover" />
              )}
              <h2 className="font-display mt-14 text-center text-[clamp(2rem,3.4vw,3.2rem)] font-light leading-[1.08] md:mt-20">{believe.heading}</h2>
              <ul className="mx-auto mt-14 grid max-w-5xl gap-x-20 gap-y-12 md:grid-cols-2">
                {values.map((v) => (
                  <li key={v.title}>
                    <h3 className="font-display text-[1.7rem] font-normal leading-tight">{v.title}</h3>
                    <p className="mt-3 max-w-md leading-[1.8] text-obsidian/65">{v.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mx-auto mt-28 max-w-3xl text-center md:mt-36">
            {about.closing.map((line, i) => (
              <p key={line} className={`font-display font-light leading-snug ${i === 0 ? "text-[clamp(1.5rem,2.4vw,2.1rem)] text-obsidian/80" : "mt-6 text-[clamp(1.8rem,3vw,2.6rem)] italic text-champagne-deep"}`}>
                {line}
              </p>
            ))}
            <BookViewingButton className="eyebrow mt-14 border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne" />
          </div>
        </div>
      </main>
  );
}

export default function AboutPage() {
  return (
    <SiteShell>
      <LangSwitch en={<AboutBody about={about} vi={false} />} vi={<AboutBody about={aboutVi} vi />} />
    </SiteShell>
  );
}
