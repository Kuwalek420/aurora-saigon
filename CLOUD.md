# Aurora Saigon: architecture overview

Luxury jewellery e-commerce atelier for Aurora Saigon (Thảo Điền, Ho Chi Minh City). Live: https://aurora-saigon.vercel.app

**Stack:** Next.js 15 (App Router, React 19, TypeScript) · Tailwind CSS 4 · Framer Motion · Lenis smooth scroll · Zustand · Supabase (PostgreSQL, Storage, Auth) · Vercel.
(`CLAUDE.md` holds the working notes and rules for the AI assistant; this file is the architectural overview.)

---

## 1. Data: Supabase is the only runtime source

| Table / bucket | Purpose | Access |
|---|---|---|
| `products` | One row per piece (418 shown): scalar columns plus JSONB `images`, `gallery`, `attributes`, `metal_pricing` (multipliers of `price_vnd`), `available_metals`, `available_karats`, `chain_lengths`; `name_vi`, `description_vi` | public read (RLS), writes through the service role only |
| `site_settings` (`id='global'`) | Storefront announcement banner | public read, admin write |
| `consultations` | Enquiries and consultation requests (written by the enquiry forms, edited in admin tab 5) | private: RLS on, no public policy, service role only |
| `price_adjustments` | Snapshots for the global metal-price tool (apply / undo) | private, service role only |
| Storage `product-images` | Photos, certificate PDFs (`certificates/`), on-hand videos (`videos/`) | public read, admin-signed uploads |

Schema and RLS: `supabase/schema.sql` (run the lock-down block and the v4 block). `lib/catalog.ts` reads Supabase (cached 60 s) and **falls back to the bundled `src/data/products.json`** if Supabase fails, so the storefront is never blank. A realtime subscription (`use-live-catalog.ts`) keeps price and sold changes live.

## 2. Two languages (EN | VI) and six currencies

- English text is the dictionary key. `src/lib/i18n-vi.ts` holds the short UI strings; `useT()` / `<T>` translate them, missing keys fall back to English. The language is the Zustand `lang` (persisted); the header has the EN | VI toggle.
- `src/lib/translations.ts` holds the long static pages in Vietnamese (about, 5 reasons, size guide, shipping and returns, payment, privacy, warranty, stone policy, FAQ, home SEO block). They are scraped from the live Vietnamese pages (`scripts/scrape-static-translations.js` -> `src/data/static-vi.json`); the few passages the live site still shows in English are authored and marked in the file. Pages render both languages and `lang-switch.tsx` shows the chosen one.
- Products: `products.name_vi` / `description_vi` (scraped from the live Vietnamese product pages; gaps are translated and listed in `translated-vi.json`). Google review translations: `src/data/google-reviews-vi.json`.
- Currency: VND base; USD, EUR, GBP, AUD, NZD via live FX (`lib/fx.ts`, cached 6 h, fallback rates in `lib/currency.ts`). Payments themselves are VND and are demos.

## 3. Catalogue, media and navigation

- **Catalogue** (`components/catalog.tsx`, `/catalog` and the home page): tabs Ready to Ship, All, Engagement Rings, Wedding Rings, Pendants & Necklaces, Fine Jewellery; a per-tab title and subtitle; filters (shape, metal, setting, band, gemstone, price).
- **Deep links:** `/catalog?category=<slug>[&gender=women|men][&metal=...][&style=curved]` (`lib/catalog-url.ts`); the page selects the tab and scrolls to the grid.
- **Engagement Rings mega menu** (`engagement-mega-menu.tsx`, 4 columns): Build a ring (Lab Diamond and Moissanite rings, Custom Engagement Ring, Loose Lab Diamond Stone, Coloured Lab Grown Diamonds), Shape, Style (incl. Toi et Moi), Metal. Only entries with stock are listed.
- **Wedding Rings mega menu** (`wedding-mega-menu.tsx`, 4 columns): Women, Women's by metal, Men, Men's by metal, all links to `/catalog?...`.
- **Women | Men toggle:** wedding rings open on Women; the all view lists women's rings first. The split comes from the live site's own listing (`scripts/scrape-wedding-gender.js` -> `src/data/wedding-gender.json`).
- **Pendants & Necklaces:** the metal filter is replaced by a Gem dropdown and a Style (cut) dropdown; only options in stock are offered.
- **On-Hand Video:** 8 of the 29 Ready to Ship pieces have an mp4 on the live site (`scripts/scrape-ready-to-ship-media.js`): re-encoded, stored in Supabase Storage, saved as `gallery.video_url`. Modal order: Front, On-Hand Video, angles, macro Detail last.
- **Loose lab diamonds:** `src/data/loose-diamonds.json` (300 stones: the cheapest of each price-matrix cell plus the lowest per fancy colour; `scripts/scrape-loose-diamonds.js`). The inspector (`diamond-inspector-modal.tsx`) has three tabs: Interactive 360° View (iframe of `https://labgrowns3.s3.ap-southeast-1.amazonaws.com/stoneimages360.html?d=<v360StoneId>`, 166 stones have one), Specifications, and Certificate (the lab's own verification page; the feed has no PDF links and no cut grade).

## 4. Pages

- **Landing routes:** `/create-your-own-engagement-ring` (3-step builder), `/shop-lab-diamonds` (price matrix, snapshot of the live inventory), `/fancy-coloured-lab-diamonds` (colour showcase). Enquiry forms on these pages are real: `app/actions/inquiry.ts` writes to `consultations` (consent, honeypot, fill-time check, 5 per hour per IP).
- **Information and policy pages:** `/about` (alias `/about-us`), `/shipping-returns` (alias `/returns-policy`), `/privacy-policy`, `/lifetime-warranty` (alias `/warranty`), `/gemstone-policy` (alias `/stone-policy`), `/faq`, `/5-reasons-why`, `/ring-size-guide`, `/payment-methods`, `/contact`, `/blog`. The aliases are permanent redirects in `next.config.mjs`.
- **Showroom** (`/showroom`): gallery, hours, booking form (demo), reviews, and the Google Maps embed toned to the Alabaster palette (`#F5F2EB`) with a CSS filter plus a multiply wash (the keyless embed cannot take a Google style map).
- **Admin** (`/admin/inventory`): 5 tabs (inventory, add product and media, discounts / metal-price tool, banner, consultations). Closed unless the admin environment variables are set.

## 5. Accounts (Supabase Auth) and the VIP Client drawer

`lib/auth.ts` (anon client with the visitor's own session; "Remember me" chooses localStorage or sessionStorage) · `components/auth-modal.tsx` (Email Address, Password, Remember me, Lost password?, LOGIN; also create account and set a new password after the reset link) · `components/account-drawer.tsx` ("VIP Client": saved ring size in `user_metadata`, the customer's own rows of `consultations`, log out). `app/actions/account.ts` verifies the access token server-side and returns only rows whose email matches the verified account. Both overlays render outside the header. Supabase setup needed: Email provider enabled, Site URL set, confirmation e-mail behaviour chosen.

## 6. Design system

Quiet luxury: one light ground (`alabaster` `#F4F0EB` token), obsidian text, champagne accents, Cormorant Garamond (display) and Inter (UI). No kicker labels, gradient text, glow shadows or glyph icons; slow `cubic-bezier(0.22,1,0.36,1)` motion; videos play only on screen and never under reduced motion. Product photos are original studio photos, never cut out (see `CLAUDE.md`, "photo-ground rule").

## 7. Deployment and environment

- **Vercel:** project `aurora-saigon`, production https://aurora-saigon.vercel.app. Deploy with `vercel deploy --prod --yes`; always stop the dev server before `next build`.
- **Environment variables** (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser), `SUPABASE_SERVICE_ROLE_KEY` (server only, never `NEXT_PUBLIC_`), `ADMIN_PASSWORD` (8+ characters), `ADMIN_SESSION_SECRET` (32+ characters). Set the same names in Vercel (Production).
- **Scripts** (`scripts/`, run with node): catalogue migration (`migrate-to-supabase.js`), Vietnamese catalogue and static pages, diamond price guide and loose stones, reviews, ready-to-ship media, wedding gender. Snapshot-based pages show their snapshot date; re-run the script and redeploy to refresh.
- **Source control:** GitHub `Kuwalek420/aurora-saigon` (`main`); deployment is by the Vercel CLI. `.gitignore` excludes `.next`, `node_modules`, `.vercel` and `.env*`. `public/` is about 420 MB (much of it unused hero frames).
