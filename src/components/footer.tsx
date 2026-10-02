import Link from "next/link";
import { footerLinks, siteConfig } from "@/data/site-config";
import Logo from "./logo";
import NewsletterForm from "./newsletter-form";
import { T } from "./t";

const link = "text-[0.88rem] text-obsidian/70 transition-colors duration-500 hover:text-champagne-deep";
const head = "eyebrow text-obsidian";

type FooterLink = { readonly label: string; readonly href: string };

function Column({ title, items }: { title: string; items: readonly FooterLink[] }) {
  return (
    <nav aria-labelledby={`footer-${title.replace(/\W+/g, "-")}`}>
      <h2 id={`footer-${title.replace(/\W+/g, "-")}`} className={head}><T>{title}</T></h2>
      <ul className="mt-6 space-y-4">
        {items.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={link}><T>{l.label}</T></Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const icon = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const SOCIALS = [
  { name: "Facebook", href: siteConfig.brand.social.facebook, glyph: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8Z" /> },
  { name: "Instagram", href: siteConfig.brand.social.instagram, glyph: (<><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" /></>) },
  { name: "YouTube", href: siteConfig.brand.social.youtube, glyph: (<><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10 9.5 5 2.5-5 2.5Z" /></>) },
];

export default function Footer() {
  const { brand } = siteConfig;
  return (
    <footer className="bg-alabaster pb-14 pt-28 text-obsidian md:pb-16 md:pt-36">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[clamp(1.9rem,3.4vw,3rem)] font-light leading-[1.1]"><T>Sign Up For Newsletter & Enjoy 10% Off Silver Jewellery</T></h2>
          <p className="mt-5 text-[0.9rem] leading-relaxed text-muted-gray"><T>Be the first to get the latest news about trends, promotions, and much more!</T></p>
          <NewsletterForm />
        </div>

        <div className="mt-28 grid gap-14 md:mt-36 md:grid-cols-[1.5fr_1fr_1fr_1.2fr] md:gap-10">
          <div>
            <Logo className="h-6" />
            <address className="mt-8 max-w-[18rem] text-[0.85rem] not-italic leading-[1.8] text-muted-gray">{brand.showroomAddress}</address>
            <p className="mt-4 text-[0.85rem] leading-[1.8]">
              <a href={`mailto:${brand.email}`} className="text-muted-gray transition-colors duration-500 hover:text-obsidian">{brand.email}</a>
              <br />
              <a href={`tel:${brand.phone.replace(/\s/g, "")}`} className="text-muted-gray transition-colors duration-500 hover:text-obsidian">{brand.phone}</a>
            </p>
            <ul className="mt-8 flex gap-5">
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="block p-1 text-obsidian/60 transition-colors duration-500 hover:text-champagne-deep">
                    <svg {...icon}>{s.glyph}</svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <Column title="All about Aurora" items={footerLinks.about} />
          <Column title="Guides" items={footerLinks.guides} />
          <Column title="Support" items={footerLinks.support} />
        </div>

        <p className="mt-24 text-[0.72rem] text-muted-gray md:mt-32"><T>aurorasaigon.com · Demo storefront · Payments are simulated · The newsletter, booking and checkout forms are demos; only the enquiry forms on the custom ring and diamond pages are sent to our team</T></p>
      </div>
    </footer>
  );
}
