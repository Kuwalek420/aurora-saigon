/**
 * The Aurora mark and wordmark, traced from the supplied logo (public/aurora-logo.svg, no background).
 * It is used as a CSS mask over a currentColor fill, so it takes the surrounding text colour
 * (text-obsidian in the header) and scales without raster edges.
 */
export default function Logo({ className = "h-5 md:h-6" }: { className?: string }) {
  const mask = "url(/aurora-logo.svg) center / contain no-repeat";
  return (
    <span
      role="img"
      aria-label="Aurora Saigon"
      className={`block aspect-[383/83] bg-current ${className}`}
      style={{ mask, WebkitMask: mask }}
    />
  );
}
