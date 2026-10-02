import map from "@/data/wedding-gender.json";

export type WeddingGender = "Women" | "Men";

const women = new Set<string>(map.women);
const men = new Set<string>(map.men);

const styles = map.styles as Record<string, string[]>;
/** Band styles the live site files a ring under (only those it really has, e.g. "Curved"). */
export const weddingStyles = (id: string): string[] => Object.keys(styles).filter((k) => styles[k].includes(id));
export const WEDDING_STYLE_COUNTS = Object.fromEntries(Object.entries(styles).map(([k, v]) => [k, v.length])) as Record<string, number>;

/** Which wedding-ring list the live site files a piece under (`getWeddingBands.php`, ringgender F/M); undefined for anything it does not list. */
export const weddingGender = (id: string): WeddingGender | undefined => (women.has(id) ? "Women" : men.has(id) ? "Men" : undefined);
