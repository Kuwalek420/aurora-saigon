import SiteShell from "./site-shell";
import ArticleBody, { type Block } from "./article-body";
import BookViewingButton from "./book-viewing-button";
import LangSwitch from "./lang-switch";

export type Section = { heading?: string; blocks: Block[]; after?: React.ReactNode };
export type PolicyContent = { title: React.ReactNode; intro?: string; sections: Section[] };

function Body({ title, intro, sections, closing }: PolicyContent & { closing: boolean }) {
  return (
    <main className="bg-alabaster pb-28 pt-36 md:pb-36 md:pt-44">
      <div className="mx-auto max-w-[36rem] px-5 md:max-w-[44rem] md:px-10">
        <div className="mx-auto max-w-[36rem]">
          <h1 className="font-display text-[clamp(2.4rem,5vw,4rem)] font-light leading-[1.04]">{title}</h1>
          {intro && <p className="mt-8 leading-[1.8] text-obsidian/70">{intro}</p>}
        </div>
        <div className="mt-16 md:mt-24">
          {sections.map((s, i) => (
            <section key={i} className={i ? "mt-24 md:mt-32" : ""}>
              {s.heading && <h2 className="font-display mx-auto mb-10 max-w-[36rem] text-[clamp(2rem,3.4vw,2.8rem)] font-light leading-[1.1]">{s.heading}</h2>}
              <ArticleBody blocks={s.blocks} shift={1} />
              {s.after}
            </section>
          ))}
        </div>
        {closing && (
          <div className="mt-24 text-center md:mt-32">
            <BookViewingButton className="eyebrow border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne" />
          </div>
        )}
      </div>
    </main>
  );
}

/** Shared layout for the policy and information pages. `vi` is the same page in Vietnamese; the visitor's language picks one. */
export default function PolicyPage({ vi, closing = false, ...en }: PolicyContent & { vi?: PolicyContent; closing?: boolean }) {
  return (
    <SiteShell>
      {vi ? <LangSwitch en={<Body {...en} closing={closing} />} vi={<Body {...vi} closing={closing} />} /> : <Body {...en} closing={closing} />}
    </SiteShell>
  );
}
