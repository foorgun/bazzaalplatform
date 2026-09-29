-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 01: Schema
-- Run this first in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════

-- Clean slate (safe to re-run)
drop table if exists final_list cascade;
drop table if exists shipments cascade;
drop table if exists campaign_candidates cascade;
drop table if exists influencers cascade;
drop table if exists campaigns cascade;
drop table if exists profiles cascade;

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('bazzaal', 'creator', 'brand')),
  brand_name text,
  created_at timestamptz default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_name text not null,
  status text check (status in ('draft', 'active', 'completed')) default 'draft',
  start_date date,
  end_date date,
  description text,
  guidelines_sent_at timestamptz,
  shared_with_client_at timestamptz,
  shipment_created_at timestamptz,
  content_posted_at timestamptz,
  completed_at timestamptz,
  target_influencer_count integer default 200,
  created_at timestamptz default now()
);

create table influencers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  instagram_handle text,
  tiktok_handle text,
  followers_count integer,
  tiktok_followers integer,
  engagement_rate numeric(4,2),
  country text default 'US',
  niche text,
  age_range text,
  ethnicity text,
  email text,
  status text check (status in ('active', 'inactive')) default 'active',
  notes text,
  median_likes integer,
  median_comments integer,
  median_views integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table campaign_candidates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  influencer_id uuid references influencers(id) on delete cascade,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  applied_at timestamptz default now(),
  reviewed_at timestamptz,
  notes text,
  ig_content_quality text,
  ig_content_style text[],
  tt_content_quality text,
  tt_content_style text[],
  brand_fit boolean default false,
  screening_notes text,
  keep_an_eye boolean default false,
  last_modified_by text
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  influencer_id uuid references influencers(id) on delete cascade,
  tracking_number text,
  carrier text check (carrier in ('DHL', 'ShipHero')),
  status text check (status in ('preparing', 'shipped', 'delivered')) default 'preparing',
  updated_at timestamptz default now()
);

create table final_list (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  influencer_id uuid references influencers(id) on delete cascade,
  approved_at timestamptz default now(),
  post_status text check (post_status in ('pending', 'posted')) default 'pending',
  follow_up_round integer default 0 check (follow_up_round between 0 and 5),
  follow_up_date date
);

create index on campaign_candidates (campaign_id);
create index on campaign_candidates (influencer_id);
create index on campaign_candidates (status);
create index on shipments (campaign_id);
create index on final_list (campaign_id);
create index on influencers (email);

-- ── Realtime ────────────────────────────────────────────────
-- Dashboard metrics + screening counters subscribe to this table.
alter publication supabase_realtime add table campaign_candidates;
