// Types and lookups for the diamond snapshots written by scripts/scrape-diamond-guide.js (src/data/*.json).

export interface LabCell { p: number; n: number; ct: number; cert: string }
export interface LabDiamondPrices {
  source: string;
  scrapedAt: string;
  currency: "VND";
  /** [min, max] carat of each row. */
  bands: number[][];
  colours: string[];
  clarities: string[];
  /** shape -> "bandIndex|colour|clarity" -> lowest price in stock (VND), stones in stock, carat of that stone, lab */
  shapes: Record<string, Record<string, LabCell>>;
}

export interface FancyStone { shape: string; carat: number; clarity: string; desc: string; price: number; cert: string }
export interface FancyColour {
  code: string;
  name: string;
  count: number;
  from: number | null;
  stones: FancyStone[];
  byShape: Record<string, { from: number; n: number }>;
}
export interface FancyDiamonds { source: string; scrapedAt: string; currency: "VND"; colours: FancyColour[] }

export const labCell = (lab: LabDiamondPrices, shape: string, band: number, colour: string, clarity: string): LabCell | undefined => lab.shapes[shape]?.[`${band}|${colour}|${clarity}`];

/** One stone with its full specification (scripts/scrape-loose-diamonds.js -> src/data/loose-diamonds.json). */
export interface LooseStone {
  id: string;
  shape: string;
  carat: number | null;
  colour: string | null;
  colourDesc: string | null;
  clarity: string | null;
  polish: string | null;
  fluorescence: string | null;
  measurements: { l: number; w: number; d: number } | null;
  ratio: number | null;
  tablePct: number | null;
  depthPct: number | null;
  crownHeight: number | null;
  crownAngle: number | null;
  pavilionDepth: number | null;
  pavilionAngle: number | null;
  price: number;
  cert: string | null;
  certNo: string | null;
  /** The live site's 360-degree viewer page for this stone, when it has one. */
  view360: string | null;
  /** The viewer's own stone id (the `d` parameter) and the full iframe URL, as the live stone page embeds them. */
  v360StoneId: string | null;
  v360IframeUrl: string | null;
}
export interface LooseDiamonds {
  scrapedAt: string;
  lab: Record<string, LooseStone>;
  fancy: Record<string, LooseStone[]>;
}
/** The stone data is loaded on first use, so the two pages do not carry it until someone opens a stone. */
export const loadLooseDiamonds = async () => (await import("@/data/loose-diamonds.json")).default as unknown as LooseDiamonds;

/** Lowest price in stock for a shape and size across D-F colour and VVS-VS clarity, and how many stones that covers. */
export function stoneFrom(lab: LabDiamondPrices, shape: string, band: number): { p: number; n: number } | null {
  let p = Infinity;
  let n = 0;
  for (const c of lab.colours) for (const cl of lab.clarities) {
    const x = labCell(lab, shape, band, c, cl);
    if (!x) continue;
    p = Math.min(p, x.p);
    n += x.n;
  }
  return Number.isFinite(p) ? { p, n } : null;
}
