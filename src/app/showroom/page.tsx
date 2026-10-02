import type { Metadata } from "next";
import { siteConfig, showroomMapsUrl } from "@/data/site-config";
import SiteShell from "@/components/site-shell";
import AppointmentForm from "@/components/appointment-form";
import LoopVideo from "@/components/loop-video";
import GoogleReviews from "@/components/google-reviews";
import { T } from "@/components/t";

export const metadata: Metadata = {
  title: "The Thảo Điền Atelier",
  description: `Experience our bespoke engagement rings and fine jewellery in person at the ${siteConfig.showroom}.`,
};

type GalleryItem = { src: string; alt: string; span: string; ratio: string; poster?: string };

/** Real media only: the atelier interior and storefront, a consultation video, and a ring-sizing photo from the live site. */
const GALLERY: GalleryItem[] = [
  { src: "/assets/showroom/interior-arch.jpg", alt: "Inside the Thảo Điền Atelier: an arched, lit wall niche with the Aurora mark, display shelves and a seating area", span: "md:col-span-7", ratio: "aspect-[4/3]" },
  { src: "/assets/showroom/exterior-window.jpg", alt: "The atelier seen from the street, with display cases and the lit Aurora niche", span: "md:col-span-5", ratio: "aspect-[4/3] md:aspect-auto md:h-full" },
  { src: "/assets/showroom/gia-consultation.mp4", poster: "/assets/showroom/gia-consultation-poster.jpg", alt: "A one-to-one consultation at the atelier, with a GIA card on the desk", span: "md:col-span-5", ratio: "aspect-[4/3] md:aspect-auto md:h-[28rem]" },
  { src: "/content/about/homepage-03.webp", alt: "Ring sizing at the atelier: a sizing gauge and a tray of stones on a wooden desk", span: "md:col-span-7", ratio: "aspect-[4/3] md:aspect-auto md:h-[28rem]" },
];

export default function ShowroomPage() {
  const { brand } = siteConfig;
  const link = "transition-colors duration-500 hover:text-champagne-deep";
  return (
    <SiteShell>
      <main className="bg-alabaster pt-36 md:pt-44">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <h1 className="font-display max-w-[18ch] text-[clamp(2.8rem,6.4vw,6rem)] font-light leading-[1]">
            <T>The Thảo Điền Atelier</T> — <em className="text-champagne-deep"><T>Private Fine Jewellery Viewing</T></em>
          </h1>
          <p className="mt-10 max-w-xl leading-[1.8] text-obsidian/70">
            <T>Experience our bespoke engagement rings and fine jewellery in person. Located in the heart of Thảo Điền, Ho Chi Minh City.</T>
          </p>

          <div className="mt-16 grid gap-4 md:mt-24 md:grid-cols-12 md:gap-6">
            {GALLERY.map((g) => (
              <figure key={g.src} className={`overflow-hidden ${g.span}`}>
                {g.poster ? (
                  <LoopVideo src={g.src} poster={g.poster} label={g.alt} className={`object-cover ${g.ratio}`} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.src} alt={g.alt} loading="lazy" className={`w-full object-cover ${g.ratio}`} />
                )}
              </figure>
            ))}
          </div>

          <div className="mt-28 grid gap-20 md:mt-36 md:grid-cols-2 md:gap-24">
            <section aria-labelledby="visit-heading">
              <h2 id="visit-heading" className="font-display text-[clamp(2rem,3.4vw,3rem)] font-light leading-[1.08]"><T>Visits & hours</T></h2>
              <dl className="mt-12 space-y-9">
                <div>
                  <dt className="eyebrow mb-2 text-[0.58rem] text-muted-gray"><T>Address</T></dt>
                  <dd className="max-w-sm text-[1.05rem] leading-[1.7]">{brand.showroomAddress}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-2 text-[0.58rem] text-muted-gray"><T>Hours</T></dt>
                  <dd className="text-[1.05rem] leading-[1.7]"><T>{brand.hours}</T></dd>
                </div>
                <div>
                  <dt className="eyebrow mb-2 text-[0.58rem] text-muted-gray"><T>Phone & email</T></dt>
                  <dd className="text-[1.05rem] leading-[1.9]">
                    <a href={`tel:${brand.phone.replace(/\s/g, "")}`} className={link}>{brand.phone}</a>
                    <span aria-hidden className="mx-3 text-obsidian/30">|</span>
                    <a href={`mailto:${brand.email}`} className={link}>{brand.email}</a>
                  </dd>
                </div>
              </dl>
              {/* interactive map of the Thảo Điền Atelier (keyless Google Maps embed, loaded only when scrolled near) */}
              {/* The keyless embed cannot take a style map, so the brand tone is done in CSS: desaturate, warm, soften, then a
                  non-interactive alabaster wash multiplied over it (the map stays fully usable). */}
              <div className="relative mt-12 aspect-[4/3] w-full overflow-hidden bg-[#F5F2EB]">
                <iframe
                  title={`Map: ${siteConfig.showroom}, ${brand.showroomAddress}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(brand.showroomAddress)}&z=17&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  style={{ filter: "grayscale(85%) sepia(15%) contrast(95%) brightness(98%)" }}
                  className="absolute inset-0 h-full w-full border-0"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#F5F2EB] mix-blend-multiply" />
              </div>
              <a href={showroomMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-[0.9rem] text-obsidian underline decoration-charcoal/30 underline-offset-[6px] transition-colors duration-500 hover:decoration-champagne">
                <T>Open in Google Maps</T>
              </a>
            </section>

            <section aria-labelledby="book-heading">
              <h2 id="book-heading" className="font-display text-[clamp(2rem,3.4vw,3rem)] font-light leading-[1.08]"><T>Book a Private Appointment</T></h2>
              <div className="mt-12 max-w-lg">
                <AppointmentForm hours={brand.hours} />
              </div>
            </section>
          </div>
        </div>
        <GoogleReviews />
      </main>
    </SiteShell>
  );
}
