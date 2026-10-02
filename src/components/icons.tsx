import { METAL_DOT, METAL_LABEL } from "@/lib/store";
import type { MetalKey } from "@/lib/types";

/** Ultra-fine (1px, non-scaling) line icons. Drawn for this site; one stroke weight throughout. */
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" } as const;

type P = { className?: string };

function Shape({ d, inner }: { d: React.ReactNode; inner?: React.ReactNode }) {
  return (
    <g {...base}>
      {d}
      {inner && <g opacity=".55">{inner}</g>}
    </g>
  );
}

const SHAPES: Record<string, React.ReactNode> = {
  Round: <Shape d={<circle cx="12" cy="12" r="8" />} inner={<><circle cx="12" cy="12" r="4" /><path d="M12 4v4M12 16v4M4 12h4M16 12h4" /></>} />,
  Oval: <Shape d={<ellipse cx="12" cy="12" rx="6" ry="9" />} inner={<><ellipse cx="12" cy="12" rx="3" ry="5.5" /><path d="M12 3v3.5M12 17.5V21" /></>} />,
  Emerald: <Shape d={<path d="M8 4h8l3 3v10l-3 3H8l-3-3V7z" />} inner={<path d="M9.5 8h5l1 1v6l-1 1h-5l-1-1V9z" />} />,
  Pear: <Shape d={<path d="M12 3C10 7 5 11.5 5 15.5a7 7 0 0 0 14 0C19 11.5 14 7 12 3z" />} inner={<path d="M12 8c-1.2 2.4-3 4.2-3 6.6a3 3 0 0 0 6 0C15 12.200 13.200 10.400 12 8z" />} />,
  Marquise: <Shape d={<path d="M12 2.500C16.500 7 17.500 13 12 21.500 6.500 13 7.500 7 12 2.500z" />} inner={<path d="M12 7.500c2 2.400 2.400 5.600 0 9-2.400-3.400-2-6.600 0-9z" />} />,
  Cushion: <Shape d={<rect x="5" y="5" width="14" height="14" rx="4.500" />} inner={<rect x="9" y="9" width="6" height="6" rx="2" />} />,
  Heart: <Shape d={<path d="M12 20C6 15.500 4 12.500 4 9.500a4 4 0 0 1 8-1.500 4 4 0 0 1 8 1.500c0 3-2 6-8 10.500z" />} inner={<path d="M12 15c-2.600-2.100-3.500-3.400-3.500-4.700a1.700 1.700 0 0 1 3.500-.6 1.700 1.700 0 0 1 3.500.6c0 1.300-.9 2.600-3.500 4.700z" />} />,
  Trillant: <Shape d={<path d="M12 4 20.500 18.500h-17z" />} inner={<path d="M12 9.500 16 16.200H8z" />} />,
};

export function ShapeIcon({ name, className = "h-6 w-6" }: P & { name: string }) {
  const g = SHAPES[name];
  if (!g) return null;
  return <svg viewBox="0 0 24 24" className={className} aria-hidden>{g}</svg>;
}
export const SHAPE_NAMES = Object.keys(SHAPES);

/** Ring seen from the front: a fine band with the setting drawn on top. */
const band = <circle cx="16" cy="17" r="6.500" />;
const SETTINGS: Record<string, React.ReactNode> = {
  Solitaire: (
    <g {...base}>
      {band}
      <path d="M13.500 6.500 16 3.500l2.500 3L16 10.500z" />
    </g>
  ),
  Halo: (
    <g {...base}>
      {band}
      <path d="M14.500 7 16 5.200 17.500 7 16 8.800z" />
      <circle cx="16" cy="7" r="3.600" opacity=".6" />
    </g>
  ),
  Trilogy: (
    <g {...base}>
      {band}
      <path d="M14.500 6.800 16 4.800l1.500 2L16 9.500z" />
      <path d="M9.800 8.500 11 7l1.200 1.500L11 10.200zM19.800 8.500 21 7l1.200 1.500L21 10.200z" opacity=".75" />
    </g>
  ),
  "Toi et Moi": (
    <g {...base}>
      {band}
      <path d="M11.500 7.500 13.300 4.800l1.800 2.700-1.800 2.600zM16.900 7.500l1.800-2.700 1.800 2.700-1.800 2.600z" />
    </g>
  ),
  Bezel: (
    <g {...base}>
      {band}
      <path d="M14.300 7 16 5l1.700 2L16 9.500z" />
      <rect x="12.200" y="3.500" width="7.600" height="7.600" rx="2.400" opacity=".6" />
    </g>
  ),
};

export function SettingIcon({ name, className = "h-6 w-8" }: P & { name: string }) {
  const g = SETTINGS[name];
  if (!g) return null;
  return <svg viewBox="0 0 32 24" className={className} aria-hidden>{g}</svg>;
}
export const SETTING_NAMES = Object.keys(SETTINGS);

/** Band profiles, matching the Band Type filter. */
const BANDS: Record<string, React.ReactNode> = {
  Plain: <g {...base}><path d="M3 10c4-3 22-3 26 0M3 14c4 3 22 3 26 0M3 10v4M29 10v4" /></g>,
  "Pavé": <g {...base}><path d="M3 10c4-3 22-3 26 0M3 14c4 3 22 3 26 0M3 10v4M29 10v4" /><g opacity=".6">{[7, 11, 15, 19, 23].map((x) => <circle key={x} cx={x + 1} cy="12" r=".9" />)}</g></g>,
  Twisted: <g {...base}><path d="M3 9c5 0 5 6 10 6s5-6 10-6M3 15c5 0 5-6 10-6s5 6 10 6" transform="translate(3 0)" /></g>,
  Cathedral: <g {...base}><path d="M3 17c6 0 7-8 13-8s7 8 13 8M3 21c6 0 7-8 13-8s7 8 13 8" transform="translate(0 -3)" /></g>,
};
export function BandIcon({ name, className = "h-6 w-8" }: P & { name: string }) {
  const g = BANDS[name];
  if (!g) return null;
  return <svg viewBox="0 0 32 24" className={className} aria-hidden>{g}</svg>;
}

/** A metal swatch with a hairline ring, readable on the light ground. */
export function MetalDot({ metal, size = 14 }: { metal: MetalKey; size?: number }) {
  return <span aria-hidden title={METAL_LABEL[metal]} className="inline-block shrink-0 rounded-full shadow-[0_0_0_1px_rgba(31,32,32,0.18)]" style={{ width: size, height: size, background: METAL_DOT[metal] }} />;
}

export const Chevron = ({ className = "" }: P) => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1" className={className} aria-hidden>
    <path d="M1 1l4 4 4-4" />
  </svg>
);

export const ResetIcon = ({ className = "h-3.5 w-3.5" }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8a5 5 0 1 0 1.700-3.700" />
    <path d="M3 2.500v3h3" />
  </svg>
);
