import type { Metadata } from "next";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase-admin";
import { CONSULTATION_COLUMNS, normalizeRow, ROW_COLUMNS, type ConsultationRow, type SpotAdjustment } from "./admin-types";
import Dashboard from "./dashboard";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

async function Body() {
  if (!adminConfigured()) {
    return <p className="mt-8 text-sm leading-relaxed text-muted-gray">Not configured. Set ADMIN_PASSWORD (8+ characters), ADMIN_SESSION_SECRET (32+ characters) and SUPABASE_SERVICE_ROLE_KEY in the environment (see .env.example), then reload.</p>;
  }
  if (!(await isAdmin())) return <LoginForm />;

  const db = adminDb();
  const [products, settings, consults, adjustments] = await Promise.all([
    db.from("products").select(ROW_COLUMNS).order("name").limit(1000),
    db.from("site_settings").select("announcement_enabled,announcement_text,announcement_link").eq("id", "global").maybeSingle(),
    db.from("consultations").select(CONSULTATION_COLUMNS).order("created_at", { ascending: false }).limit(1000),
    db.from("price_adjustments").select("id,created_at,metal_keys,percent,item_count").is("undone_at", null).order("id", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (products.error || settings.error) {
    return <p role="alert" className="mt-8 text-sm leading-relaxed text-obsidian">Could not read the database: {(products.error ?? settings.error)!.message}. Run the latest supabase/schema.sql in the Supabase SQL editor (it adds the archive, sale and settings fields), then reload.</p>;
  }
  if (!products.data.length) return <p className="mt-8 text-sm text-muted-gray">The table is empty. Run npm run migrate:supabase.</p>;

  const v = settings.data;
  return <Dashboard initialRows={products.data.map(normalizeRow)} announcement={{ enabled: v?.announcement_enabled === true, message: v?.announcement_text ?? "", link: v?.announcement_link ?? "" }}
      // these two tables come from the latest schema.sql; the tabs explain themselves if it has not been run yet
      consultations={{ rows: (consults.data ?? []) as ConsultationRow[], error: consults.error?.message ?? null }}
      spot={{ ready: !adjustments.error, last: adjustments.data ? ({ ...adjustments.data, percent: Number(adjustments.data.percent) } as SpotAdjustment) : null }}
    />;
}

export default function AdminPage() {
  return (
    <main className="min-h-[100dvh] bg-alabaster px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-light leading-none">Admin</h1>
        <Body />
      </div>
    </main>
  );
}
