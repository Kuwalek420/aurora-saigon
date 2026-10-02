import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/site-config";

const display = Cormorant_Garamond({ subsets: ["latin", "vietnamese"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const sans = Inter({ subsets: ["latin", "vietnamese"], weight: ["300", "400", "500"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${siteConfig.brand.name} Fine Jewellery | ${siteConfig.origin.short}`, template: `%s | ${siteConfig.brand.name}` },
  description: `Bespoke fine jewellery. ${siteConfig.origin.short}. Certified lab and natural diamonds, ${siteConfig.warranty.rings} on rings, free insured delivery in Ho Chi Minh City.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
