-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 09: Campaign requests from brands
-- Backs /brand-request. Safe to run on an existing database.
-- ════════════════════════════════════════════════════════════

create table if not exists campaign_requests (
  id uuid primary key default gen_random_uuid(),
  brand_name text,
  campaign_name text not null,
  product_name text,
  product_description text,
  campaign_goal text,
  platform text[],
  min_followers integer,
  target_countries text[],
  preferred_content_style text[],
  influencer_count integer,
  preferred_start_date date,
  campaign_month text,
  budget integer,
  additional_notes text,
  status text default 'pending',
  submitted_at timestamptz default now()
);

create index if not exists campaign_requests_brand_idx on campaign_requests (brand_name);

-- ── RLS ─────────────────────────────────────────────────────
-- Without this the table would be readable by every signed-in user,
-- so one brand could read another brand's briefs and budgets.
alter table campaign_requests enable row level security;

drop policy if exists "bazzaal: campaign requests" on campaign_requests;
create policy "bazzaal: campaign requests" on campaign_requests for all
  using ((select bz_role()) = 'bazzaal') with check ((select bz_role()) = 'bazzaal');

drop policy if exists "brand: read own requests" on campaign_requests;
create policy "brand: read own requests" on campaign_requests for select
  using ((select bz_role()) = 'brand' and brand_name = (select bz_brand()));

drop policy if exists "brand: submit own requests" on campaign_requests;
create policy "brand: submit own requests" on campaign_requests for insert
  with check ((select bz_role()) = 'brand' and brand_name = (select bz_brand()));
