/**
 * Single source of truth for verified business facts and policies.
 * Anything on the site that states where pieces are made, what warranty applies, or how to reach the business
 * must read from here, so the copy cannot drift apart again.
 */
export const siteConfig = {
  brand: {
    name: "Aurora Saigon",
    /** Customer-facing showroom and atelier. */
    showroomAddress: "94 Xuân Thủy, Thảo Điền, Quận 2, Hồ Chí Minh 70000, Vietnam",
    /** Official registered corporate address (the legal entity named in the privacy policy). */
    legalRegisteredAddress: "Tầng 7, 60 Nguyễn Văn Thủ, Phường Đa Kao, Quận 1, Hồ Chí Minh, Vietnam",
    legalEntity: "Aurora Saigon Co., Ltd.",
    /** Opening hours as published on the live contact page (open daily). */
    hours: "Monday – Sunday: 10:30 AM – 7:30 PM",
    email: "sales@aurorasaigon.com",
    phone: "+84 344 700 879",
    social: {
      facebook: "https://www.facebook.com/aurorasaigonjewelry",
      instagram: "https://www.instagram.com/aurorasaigonjewelry/",
      youtube: "https://www.youtube.com/@aurorasaigonjewelry",
    },
  },
  /** Where pieces come from. `short` is the one-line form for tight spaces. */
  origin: {
    full: "Designed in Ho Chi Minh City, Handcrafted by Master Artisans in Bangkok",
    short: "Designed in Ho Chi Minh City, Handcrafted in Bangkok",
    workshop: "Bangkok",
  },
  warranty: {
    /** Engagement, wedding and fashion rings. */
    rings: "UK Standard Lifetime Warranty",
    /** Pendants, earrings, bracelets and chains. */
    fineJewellery: "2-Year Fine Jewellery Warranty",
  },
  showroom: "Thảo Điền Atelier, Ho Chi Minh City",
  /**
   * Payment processing, stated once so the FAQ, payment page and privacy policy cannot disagree.
   * (The bank for direct transfers is published on the payment page itself, from the live site.)
   */
  /** Direct bank transfer details, exactly as published on the live payment page. */
  bankDetails: {
    bankName: "ACB - PGD Ngô Tất Tố",
    accountHolder: "CONG TY TNHH AURORA SAIGON",
    accountNumber: "16566576",
  },
  /** The methods the checkout offers, in the order the payment page lists them. */
  checkoutProcess: {
    methods: [
      "Domestic Card / ATM via Payment Gateway (Visa/MasterCard/JCB)",
      "Direct Bank Transfer to ACB",
      "International Credit Card via Stripe (Demo)",
    ],
  },
  paymentGateways: {
    domestic: "AlePay",
    international: "Stripe",
    summary: "Domestic Vietnam card payments via AlePay and direct bank transfer; international payments processed securely via Stripe.",
    demoNote: "This storefront runs in Simulated Demo Mode: no payment is taken and nothing is stored.",
  },
} as const;

/** Google Maps search for the showroom (opens the venue in a new tab). */
export const showroomMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.brand.showroomAddress)}`;

/** Warranty label for a catalog piece: rings carry the lifetime warranty, everything else the 2-year one. */
export function warrantyFor(p: { isRing: boolean }): string {
  return p.isRing ? siteConfig.warranty.rings : siteConfig.warranty.fineJewellery;
}

/** Footer destinations. Every one is a page of this storefront, so a visitor never leaves the site. */
export const footerLinks = {
  about: [
    { label: "About Aurora Saigon", href: "/about" },
    { label: "Visit Our Showroom", href: "/showroom" },
    { label: "5 Reasons Why", href: "/5-reasons-why" },
    { label: "Contact Us", href: "/contact" },
  ],
  guides: [
    { label: "Custom Rings", href: "/create-your-own-engagement-ring" },
    { label: "Lab Diamonds", href: "/shop-lab-diamonds" },
    { label: "Fancy Coloured", href: "/fancy-coloured-lab-diamonds" },
    { label: "Ring Size Guide", href: "/ring-size-guide" },
    { label: "Journal", href: "/blog" },
  ],
  support: [
    { label: "Shipping & Returns", href: "/shipping-returns" },
    { label: "Payment Methods", href: "/payment-methods" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Warranty Policy", href: "/lifetime-warranty" },
    { label: "Customer Supplied Gemstone Policy", href: "/gemstone-policy" },
    { label: "FAQ", href: "/faq" },
  ],
} as const;
