import type { Metadata } from "next";
import Link from "next/link";
import policies from "@/data/policies.json";
import { siteConfig } from "@/data/site-config";
import SiteShell from "@/components/site-shell";
import BookViewingButton from "@/components/book-viewing-button";
import { T } from "@/components/t";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Reach ${siteConfig.brand.name} by email, phone or at our ${siteConfig.showroom}.`,
};

export default function ContactPage() {
  const { brand } = siteConfig;
  const { contact } = policies;
  const rows: [React.ReactNode, React.ReactNode][] = [
    [<T key="k1">Email</T>, <a key="e" href={`mailto:${brand.email}`} className="transition-colors duration-500 hover:text-champagne-deep">{brand.email}</a>],
    [<T key="k2">Phone</T>, <a key="p" href={`tel:${brand.phone.replace(/\s/g, "")}`} className="transition-colors duration-500 hover:text-champagne-deep">{brand.phone}</a>],
    [<T key="k3">Showroom</T>, <Link key="s" href="/showroom" className="transition-colors duration-500 hover:text-champagne-deep">{siteConfig.showroom}, {brand.showroomAddress}</Link>],
    [<T key="k4">Opening hours</T>, <T key="h">{brand.hours}</T>],
  ];
  return (
    <SiteShell>
      <main className="bg-alabaster pb-28 pt-36 md:pb-36 md:pt-44">
        <div className="mx-auto max-w-[56rem] px-5 md:px-10">
          <h1 className="font-display text-[clamp(2.6rem,5.6vw,5rem)] font-light leading-[1.02]"><T>Contact</T> <em className="text-champagne-deep"><T>us</T></em></h1>
          <dl className="mt-16 grid gap-x-16 gap-y-10 md:mt-24 md:grid-cols-2">
            {rows.map(([k, v], i) => (
              <div key={i}>
                <dt className="eyebrow mb-3 text-[0.58rem] text-muted-gray">{k}</dt>
                <dd className="font-display max-w-sm text-[1.5rem] leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-20 max-w-xl space-y-5 leading-[1.8] text-obsidian/65">
            {contact.replyWithinHours && <p><T vars={{ n: contact.replyWithinHours }}>{"For an existing order, email us with your order number and we will reply within {n} hours."}</T></p>}
            {contact.returnsNote && <p><T>{`Please note that ${contact.returnsNote}.`}</T> <T>See our</T> <Link href="/shipping-returns" className="border-b border-obsidian/40 text-obsidian transition-colors duration-500 hover:border-champagne"><T>shipping and returns</T></Link> <T>page.</T></p>}
          </div>
          <BookViewingButton className="eyebrow mt-16 border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne" />
        </div>
      </main>
    </SiteShell>
  );
}
