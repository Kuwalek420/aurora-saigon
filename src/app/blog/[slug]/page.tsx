import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import blog from "@/data/blog.json";
import SiteShell from "@/components/site-shell";
import ArticleBody, { type Block } from "@/components/article-body";

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso)) : "";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return blog.posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blog.posts.find((p) => p.slug === slug);
  return post ? { title: post.title, description: post.excerpt.slice(0, 160) } : {};
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = blog.posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const more = blog.posts.filter((p) => p.slug !== slug).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, 3);

  return (
    <SiteShell>
      <main className="bg-alabaster pb-28 pt-36 md:pb-36 md:pt-44">
        <article className="mx-auto max-w-[1100px] px-5 md:px-10">
          <Link href="/blog" className="eyebrow border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 hover:border-champagne">The Journal</Link>
          <h1 className="font-display mx-auto mt-12 max-w-[22ch] text-center text-[clamp(2.4rem,5vw,4.6rem)] font-light leading-[1.04]">{post.headline}</h1>
          <p className="mt-6 text-center text-[0.8rem] text-muted-gray">{formatDate(post.date)}</p>
          {post.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.cover.src} alt={post.cover.alt} className="mt-14 aspect-[16/9] w-full object-cover md:mt-20" />
          )}
          <div className="mt-14 md:mt-20">
            <ArticleBody blocks={post.body as Block[]} />
          </div>
        </article>

        <section className="mx-auto mt-28 max-w-[1400px] px-5 md:mt-36 md:px-10">
          <h2 className="font-display text-[clamp(2rem,3.4vw,3rem)] font-light leading-[1.08]">More from the journal</h2>
          <ul className="mt-12 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <div className="overflow-hidden">
                    {p.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover.src} alt={p.cover.alt} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
                    )}
                  </div>
                  <h3 className="font-display mt-6 text-[1.5rem] font-normal leading-snug transition-colors duration-500 group-hover:text-champagne-deep">{p.title}</h3>
                  <p className="mt-2 text-[0.78rem] text-muted-gray">{formatDate(p.date)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteShell>
  );
}
