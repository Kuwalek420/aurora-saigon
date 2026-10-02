import type { Config } from "tailwindcss";

/**
 * Aurora Saigon design tokens (locked).
 * Loaded by Tailwind 4 through `@config` in src/app/globals.css.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        alabaster: "#F4F0EB", // the single studio-floor tone: body, sections, modal and photo ground
        obsidian: "#0D0E0E", // primary dark background: hero and accent sections
        champagne: "#B8975A", // muted luxury gold for fills, rules and anything on obsidian (7.0:1 there)
        "champagne-deep": "#7F6228", // the same gold for TEXT on the light ground (5.0:1; plain champagne is only 2.4:1)
        charcoal: "#1F2020", // subtle borders and dark card backgrounds
        "muted-gray": "#6B6862", // subtitles, metadata, secondary details (4.9:1 on the light ground; the old #8E8E8E was 2.9:1)
        cream: "#F4F0EB", // same tone as alabaster; kept as the explicit photo-ground token

        // Legacy aliases so existing components adopt the new palette without edits.
        gold: "#B8975A",
        "gold-soft": "#B8975A",
        ink: "#1F2020",
        raised: "#262727",
        mute: "#8E8E8E",
        line: "rgba(251, 249, 245, 0.1)",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Cormorant Garamond", "Editorial New", "serif"],
        sans: ["var(--font-inter)", "Inter", "Neue Haas Grotesk", "sans-serif"],
      },
    },
  },
};

export default config;
