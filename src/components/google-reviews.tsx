import data from "@/data/google-reviews.json";
import viData from "@/data/google-reviews-vi.json";
import ReviewText from "./review-text";
import { T } from "./t";

function Stars({ rating }: { rating: number }) {
  return (
    <span role="img" aria-label={`${rating} out of 5 stars`} className="flex gap-1 text-champagne">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden>
          <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Real Google reviews for the Thảo Điền showroom (scripts/scrape-reviews.js -> google-reviews.json), shown as
 * quiet, borderless columns. Names, dates and text are exactly as Google published them.
 */
export default function GoogleReviews({ count = 6 }: { count?: number }) {
  const { business, reviews } = data;
  const vi = viData.reviews as Record<string, { excerpt_vi: string; text_vi: string }>;
  const shown = reviews.filter((r) => r.featured).slice(0, count);

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="bg-alabaster py-28 md:py-36">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="reviews-heading" className="font-display text-[clamp(2.4rem,4.6vw,4.2rem)] font-light leading-[1.04]">
            <T>Trusted in</T> <em className="text-champagne-deep">Saigon</em>
          </h2>
          <p className="mt-6 text-balance leading-[1.8] text-muted-gray">
            <T vars={{ n: business.rating.toFixed(1) }}>{"Rated {n} Stars on Google Reviews • Read verified experiences from our Thảo Điền showroom."}</T>
          </p>
        </div>

        <ul className="mt-20 grid items-start gap-x-14 gap-y-20 md:mt-28 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <li key={r.id}>
              <Stars rating={r.rating} />
              <figure className="mt-6">
                <blockquote>
                  <ReviewText excerpt={r.excerpt} fullText={r.fullText} excerptVi={vi[r.id]?.excerpt_vi} fullTextVi={vi[r.id]?.text_vi} href={r.googleUrl} />
                </blockquote>
                <figcaption className="mt-6">
                  <p className="eyebrow text-[0.62rem] text-obsidian">{r.author}</p>
                  <p className="eyebrow mt-2 text-[0.52rem] leading-[1.9] tracking-[0.16em]! text-muted-gray">
                    <T>Google review</T>{r.category ? <> · <T>{r.category}</T></> : null} · {r.dateLabel}
                  </p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <p className="mt-20 text-center md:mt-28">
          <a
            href={business.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.9rem] text-obsidian underline decoration-charcoal/30 underline-offset-[6px] transition-colors duration-500 hover:decoration-champagne"
          >
            <T>Verify all reviews on Google Maps</T>
          </a>
        </p>
      </div>
    </section>
  );
}
