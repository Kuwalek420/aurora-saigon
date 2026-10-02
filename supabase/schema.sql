-- Aurora Saigon: the complete product catalogue. Run in the Supabase SQL editor (Dashboard > SQL Editor).
-- Idempotent: safe on a fresh project and on one that already ran the first (inventory-only) version.
create table if not exists public.products (
  id                text primary key,
  slug              text not null unique,
  name              text not null,
  category          text not null,                                  -- source category: Engagement Rings, Wedding Rings, Custom Rings, Fine Jewellery
  price_vnd         bigint not null check (price_vnd >= 0),         -- base price; metal_pricing multiplies it
  is_ready_to_ship  boolean not null default false,
  is_sold           boolean not null default false,
  description       text not null default '',
  images            jsonb not null default '[]'::jsonb,             -- main photo first, then every gallery photo URL
  available_metals  jsonb not null default '[]'::jsonb,             -- ["YG","WG","RG","PT"]
  available_karats  jsonb not null default '[]'::jsonb,             -- ["9k","14k","18k"]
  metal_pricing     jsonb not null default '{}'::jsonb,             -- {"9k":0.66,"14k":0.857,"18k":1,"platinum":1.11}: multipliers of price_vnd
  gallery           jsonb not null default '{}'::jsonb,             -- {photos, detail, angles, angleVariants, stone}
  attributes        jsonb not null default '{}'::jsonb,             -- {metal, gemstone, shape, carat, stoneSize, colour, clarity}
  product_type      text,                                           -- 'pendant' or null
  chain_lengths     jsonb not null default '[]'::jsonb,
  pendant_size      text,
  updated_at        timestamptz not null default now()
);

-- Upgrade path: the first version stored images / available_* as text[]. Convert them to JSONB in place.
do $$
declare c text;
begin
  foreach c in array array['images', 'available_metals', 'available_karats'] loop
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = c and data_type = 'ARRAY') then
      execute format('alter table public.products alter column %I drop default', c);
      execute format('alter table public.products alter column %I type jsonb using to_jsonb(%I)', c, c);
      execute format('alter table public.products alter column %I set default %L', c, '[]');
    end if;
  end loop;
end $$;

-- ...and add anything else the first version lacked.
alter table public.products add column if not exists metal_pricing jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists gallery       jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists attributes    jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists product_type  text;
alter table public.products add column if not exists chain_lengths jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists pendant_size  text;

create index if not exists products_stock_idx on public.products (is_ready_to_ship, is_sold);
create index if not exists products_updated_idx on public.products (updated_at);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- Row level security: the public (anon key) may read; only the service role may write.
-- The admin page writes through a server action using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
alter table public.products enable row level security;
drop policy if exists "products are readable by everyone" on public.products;
create policy "products are readable by everyone" on public.products for select to anon, authenticated using (true);

-- Realtime: open catalog tabs pick up edits without reloading.
do $$ begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null; end $$;

-- Storage: public bucket for photos uploaded from /admin/inventory. Reads are public; writes happen only through
-- one-time signed upload URLs that the admin-only server action issues, so there is no anon insert policy.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'];

-- ---------------------------------------------------------------------------------------------
-- Admin dashboard (v3): archive, sale pricing, certificates, site settings. Idempotent.
-- ---------------------------------------------------------------------------------------------
alter table public.products add column if not exists is_archived        boolean not null default false;  -- soft delete: hidden from the storefront, restorable
alter table public.products add column if not exists original_price_vnd bigint check (original_price_vnd is null or original_price_vnd >= 0);  -- price before the sale; null = not on sale
alter table public.products add column if not exists discount_percent   numeric(5,2) check (discount_percent is null or (discount_percent > 0 and discount_percent < 100));
alter table public.products add column if not exists certificate_url    text;                              -- GIA / IGI certificate PDF in the product-images bucket
create index if not exists products_archived_idx on public.products (is_archived);

-- Site-wide settings: a single row (id 'global'). The announcement bar reads announcement_enabled / _text / _link.
create table if not exists public.site_settings (
  id                    text primary key default 'global',
  announcement_enabled  boolean not null default false,
  announcement_text     text not null default '',
  announcement_link     text,
  updated_at            timestamptz not null default now()
);
insert into public.site_settings (id) values ('global') on conflict (id) do nothing;

-- The bucket also holds certificate PDFs now.
update storage.buckets set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'] where id = 'product-images' and allowed_mime_types is not null;

-- ---------------------------------------------------------------------------------------------
-- LOCK DOWN WRITES. The public (anon) key ships in the website's JavaScript, so it must never be able to write.
-- This removes every existing policy on these tables (including any permissive ones added in the dashboard),
-- re-creates read-only access, and revokes write privileges. The admin writes with the service role, which bypasses RLS.
-- ---------------------------------------------------------------------------------------------
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' and tablename in ('products', 'site_settings') loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;
create policy "products are readable by everyone" on public.products for select to anon, authenticated using (true);
create policy "settings are readable by everyone" on public.site_settings for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.products from anon, authenticated;
revoke insert, update, delete, truncate on public.site_settings from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Admin operations (v4): consultation tracker + safety net for bulk price changes. Idempotent.
-- Both tables hold private data: RLS is on with NO policy and anon/authenticated have no privileges,
-- so only the service role (the admin server actions) can read or write them.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.consultations (
  id              uuid primary key default gen_random_uuid(),
  client_name     text not null,
  email           text,
  phone           text,
  preferred_date  date,
  status          text not null default 'New Inquiry' check (status in ('New Inquiry', 'Scheduled', 'Deposit Paid', 'Completed', 'Cancelled')),
  notes           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists consultations_status_idx on public.consultations (status, created_at desc);

drop trigger if exists consultations_touch on public.consultations;
create trigger consultations_touch before update on public.consultations
  for each row execute function public.touch_updated_at();

-- One row per spot-price adjustment, with the prices as they were, so the last one can be undone.
create table if not exists public.price_adjustments (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  metal_keys  text[] not null,
  percent     numeric(6,2) not null,
  item_count  integer not null,
  snapshot    jsonb not null,
  undone_at   timestamptz
);

alter table public.consultations enable row level security;
alter table public.price_adjustments enable row level security;
revoke all on public.consultations from anon, authenticated;
revoke all on public.price_adjustments from anon, authenticated;
