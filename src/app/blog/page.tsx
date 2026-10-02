import type { Metadata } from "next";
import Link from "next/link";
import blog from "@/data/blog.json";
import SiteShell from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Journal",
  description: "Guides to diamonds, gemstones and fine jewellery from the Aurora Saigon team.",
};

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso)) : "";

type Post = (typeof blog.posts)[number];

function Cover({ p, className }: { p: Post; className: string }) {
  return p.cover ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.cover.src} alt={p.cover.alt} loading="lazy" className={`w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] ${className}`} />
  ) : (
    <div className={`w-full bg-obsidian/5 ${className}`} />
  );
}

export default function BlogPage() {
  const posts = [...blog.posts].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const [lead, ...rest] = posts;

  return (
    <SiteShell>
      <main className="bg-alabaster pb-28 pt-36 md:pb-36 md:pt-44">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <h1 className="font-display text-[clamp(3rem,7vw,6.5rem)] font-light leading-[0.98]">The <em className="text-champagne-deep">Journal</em></h1>
          <p className="mt-8 max-w-md leading-[1.8] text-obsidian/65">Plain-spoken guides to diamonds, gemstones and the making of fine jewellery.</p>

          <Link href={`/blog/${lead.slug}`} className="group mt-16 grid items-center gap-10 md:mt-24 md:grid-cols-[1.4fr_1fr] md:gap-16">
            <div className="overflow-hidden"><Cover p={lead} className="aspect-[4/3]" /></div>
            <div>
              <h2 className="font-display text-[clamp(2rem,3.4vw,3.2rem)] font-light leading-[1.08] transition-colors duration-500 group-hover:text-champagne-deep">{lead.title}</h2>
              <p className="mt-3 text-[0.78rem] text-muted-gray">{formatDate(lead.date)}</p>
              <p className="mt-6 line-clamp-5 max-w-md leading-[1.8] text-obsidian/65">{lead.excerpt}</p>
              <span className="eyebrow mt-8 inline-block border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 group-hover:border-champagne">Read the article</span>
            </div>
          </Link>

          <ul className="mt-24 grid gap-x-10 gap-y-20 sm:grid-cols-2 md:mt-32 lg:grid-cols-3">
            {rest.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <div className="overflow-hidden"><Cover p={p} className="aspect-[4/3]" /></div>
                  <h3 className="font-display mt-6 text-[1.6rem] font-normal leading-snug transition-colors duration-500 group-hover:text-champagne-deep">{p.title}</h3>
                  <p className="mt-2 text-[0.78rem] text-muted-gray">{formatDate(p.date)}</p>
                  <p className="mt-4 line-clamp-3 leading-[1.75] text-obsidian/65">{p.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </SiteShell>
  );
}
