import Link from "next/link";
import { siteConfig } from "@/data/site-config";
import LoopVideo from "./loop-video";
import { T } from "./t";

/** A quiet homepage moment: a short loop of a client at the atelier, and a way to visit. */
export default function ClientExperience() {
  return (
    <section aria-labelledby="atelier-visit" className="bg-alabaster pb-8 pt-4 md:pb-12">
      <div className="mx-auto grid max-w-[1000px] items-center gap-10 px-5 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-16 md:px-10">
        <LoopVideo src="/assets/showroom/client-tryon.mp4" poster="/assets/showroom/client-tryon-poster.jpg" label="A client delighted with her ring in front of the arched Aurora wall at the atelier" />
        <div>
          <h2 id="atelier-visit" className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-light leading-[1.1]"><T>Try it on in the atelier</T></h2>
          <p className="mt-5 max-w-sm leading-[1.8] text-obsidian/70"><T>{`Visit ${siteConfig.showroom} to see our rings in person.`}</T></p>
          <Link href="/showroom" className="eyebrow mt-8 inline-block border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne">
            <T>Visit the showroom</T>
          </Link>
        </div>
      </div>
    </section>
  );
}
