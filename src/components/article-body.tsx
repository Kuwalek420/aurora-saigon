export type Block = { type: string; text?: string; items?: string[]; src?: string; alt?: string };

/** Source bold arrives as **markers**; render it as a weight-and-tone step (500, full obsidian) against the 400 / 70% body. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith("**") ? <strong key={i} className="font-medium text-obsidian">{part.slice(2, -2)}</strong> : part,
      )}
    </>
  );
}

/**
 * Bolds the first occurrence of each phrase in paragraphs and list items (text already bold is left alone).
 * Used where the live source carries no emphasis of its own; it only marks words that are already there.
 */
export function emphasize(blocks: Block[], phrases: string[]): Block[] {
  const mark = (text: string) =>
    text
      .split(/(\*\*[^*]+\*\*)/)
      .map((seg, i) => (i % 2 ? seg : phrases.reduce((s, p) => s.replace(p, `**${p}**`), seg)))
      .join("");
  return blocks.map((b) => (b.type === "p" && b.text ? { ...b, text: mark(b.text) } : b.items ? { ...b, items: b.items.map(mark) } : b));
}

// Heading roles. Display serif for the first three steps, a sans medium for the smallest so it reads as a subhead, not a label.
const H = {
  l2: "font-display mt-16 text-[clamp(1.8rem,2.8vw,2.4rem)] font-light leading-[1.12] first:mt-0",
  l3: "font-display [font-variant-numeric:lining-nums] mt-14 text-[1.7rem] font-normal leading-[1.2] first:mt-0",
  l3b: "font-display [font-variant-numeric:lining-nums] mt-12 text-[1.35rem] font-normal leading-snug first:mt-0",
  l4: "mt-10 text-[1rem] font-medium leading-snug text-obsidian first:mt-0",
} as const;

/**
 * Renders scraped content blocks (headings, paragraphs, lists, images) for articles and policy pages.
 * `shift` demotes headings one step for pages that already carry their own section titles.
 */
export default function ArticleBody({ blocks, shift = 0 }: { blocks: Block[]; shift?: 0 | 1 }) {
  const cls = (type: string) => (shift ? ({ h2: H.l3, h3: H.l3b, h4: H.l4 } as Record<string, string>)[type] : ({ h2: H.l2, h3: H.l3, h4: H.l4 } as Record<string, string>)[type]);
  return (
    // 36rem is about 70 characters at 16px: the reading measure. A heading is followed by tighter space than precedes it.
    <div className="mx-auto max-w-[36rem] [&_:is(h2,h3,h4)+*]:mt-4!">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return <h2 key={i} className={cls("h2")}>{b.text}</h2>;
          case "h3":
            return <h3 key={i} className={cls("h3")}>{b.text}</h3>;
          case "h4":
            return <h4 key={i} className={cls("h4")}>{b.text}</h4>;
          case "ul":
          case "ol": {
            const List = b.type as "ul" | "ol";
            return (
              <List key={i} className={`mt-5 space-y-3 pl-5 leading-[1.8] text-obsidian/70 ${b.type === "ul" ? "list-disc" : "list-decimal"} marker:text-champagne-deep`}>
                {b.items?.map((it) => <li key={it}><Rich text={it} /></li>)}
              </List>
            );
          }
          case "img":
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={b.src} alt={b.alt ?? ""} loading="lazy" className="mx-auto mt-12 w-full" />
            );
          default:
            return <p key={i} className="mt-5 leading-[1.8] text-obsidian/70 first:mt-0"><Rich text={b.text ?? ""} /></p>;
        }
      })}
    </div>
  );
}
