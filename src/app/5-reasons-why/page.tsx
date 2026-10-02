import type { Metadata } from "next";
import reasons from "@/data/five-reasons.json";
import { siteConfig } from "@/data/site-config";
import SiteShell from "@/components/site-shell";
import BookViewingButton from "@/components/book-viewing-button";
import LangSwitch from "@/components/lang-switch";
import { reasonsVi } from "@/lib/translations";

export const metadata: Metadata = {
  title: "5 Reasons Why",
  description: "Five reasons to choose Aurora Saigon jewellery: authentic gemstones, iconic designs, fair prices, independent certification and personal service.",
};

/** The source headings are all caps; set them as sentence case so the serif can breathe. */
const sentence = (s: string) => {
  const t = s.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** The live intro says "handcrafted in Saigon"; site-config.origin is the verified fact. */
const introEn = reasons.intro.replace(/handcrafted in Saigon/i, `designed in Ho Chi Minh City and handcrafted in ${siteConfig.origin.workshop}`);

/**
 * Owner-approved replacements for two live claims that conflicted with the catalog (it sells certified lab-grown
 * diamonds) and the showroom (the live copy says the brand has no storefront). Applied at render time so a
 * re-scrape of five-reasons.json cannot bring the old wording back.
 */
const CORRECTIONS: [string, string][] = [
  [
    "We exclusively use natural gemstones in every piece we sell because real women call for real gems.",
    "We curate ethically sourced natural gemstones and premium certified lab-grown diamonds, providing independent grading (GIA/IGI) for our diamonds, alongside strict authenticity guarantees for every piece.",
  ],
  [
    "Since we don’t have expensive storefronts and only offer jewellery that our customers adore, we can create for less, reduce waste, and keep our prices fair.",
    "Rather than inflating margins to fund high-street retail storefronts, we operate a dedicated boutique in Thảo Điền — passing those operational savings directly on to you while remaining personally accessible. We only offer jewellery that our customers adore, so we can create for less, reduce waste, and keep our prices fair.",
  ],
];
const sentenceVi = (s: string) => sentence(s); // the Vietnamese headings are all caps too
const correct = (text: string) => CORRECTIONS.reduce((t, [from, to]) => t.replace(from, to), text);

function ReasonsBody({ data, intro, vi }: { data: typeof reasons; intro: string; vi: boolean }) {
  return (
      <main className="bg-alabaster pb-28 pt-36 md:pb-36 md:pt-44">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <h1 className="font-display text-[clamp(2.8rem,6.4vw,6rem)] font-light leading-[1]">
            {vi ? <>5 Lý Do Chọn <em className="text-champagne-deep">Aurora Saigon</em></> : <>5 Reasons Why <em className="text-champagne-deep">Aurora Saigon</em></>}
          </h1>

          {data.banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.banner.src} alt={vi ? "Nhẫn đá quý hình quả lê của Aurora Saigon" : "Pear-shaped gemstone rings by Aurora Saigon"} className="mt-14 aspect-[16/7] w-full object-cover mix-blend-multiply md:mt-20" />
          )}
          <p className="mx-auto mt-14 max-w-[36rem] text-center leading-[1.8] text-obsidian/70 md:mt-20">{intro}</p>

          <div className="mt-28 space-y-28 md:mt-36 md:space-y-36">
            {data.reasons.map((r, i) => {
              const photoLeft = i % 2 === 0;
              return (
                <section key={r.n} className="grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-24">
                  <figure className={photoLeft ? "" : "md:order-2"}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image.src} alt={r.image.alt} loading="lazy" className="aspect-[4/5] w-full object-cover mix-blend-multiply" />
                  </figure>
                  <div className={photoLeft ? "" : "md:order-1"}>
                    <p aria-hidden className="font-display text-[clamp(4.5rem,9vw,8rem)] font-light leading-none text-champagne/60 [font-variant-numeric:lining-nums]">
                      {String(r.n).padStart(2, "0")}
                    </p>
                    <h2 className="font-display mt-4 text-[clamp(2rem,3.4vw,3.2rem)] font-light leading-[1.08]">{sentenceVi(r.heading)}</h2>
                    <p className="mt-8 max-w-[36rem] leading-[1.8] text-obsidian/70">{vi ? r.body : correct(r.body)}</p>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-28 text-center md:mt-36">
            <BookViewingButton className="eyebrow border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne" />
          </div>
        </div>
      </main>
  );
}

export default function FiveReasonsPage() {
  return (
    <SiteShell>
      <LangSwitch en={<ReasonsBody data={reasons} intro={introEn} vi={false} />} vi={<ReasonsBody data={reasonsVi} intro={reasonsVi.intro} vi />} />
    </SiteShell>
  );
}
