-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 08: Screening workspace fields
-- Backs the two-panel screening page.
-- Safe to run on an existing database and safe to re-run.
-- ════════════════════════════════════════════════════════════

alter table campaigns add column if not exists target_influencer_count integer default 200;

alter table campaign_candidates add column if not exists ig_content_quality text;
alter table campaign_candidates add column if not exists ig_content_style   text[];
alter table campaign_candidates add column if not exists tt_content_quality text;
alter table campaign_candidates add column if not exists tt_content_style   text[];
alter table campaign_candidates add column if not exists brand_fit          boolean default false;
alter table campaign_candidates add column if not exists screening_notes    text;
alter table campaign_candidates add column if not exists keep_an_eye        boolean default false;
alter table campaign_candidates add column if not exists last_modified_by   text;

-- The Application Details section shows TikTok reach next to IG reach, which
-- the influencers table had no column for.
alter table influencers add column if not exists tiktok_followers integer;

-- Optional demo backfill: TikTok reach as a plausible share of IG reach.
-- Delete this block if you want the field to stay empty until it is real data.
update influencers
set tiktok_followers = round(followers_count * 0.62)
where tiktok_followers is null
  and followers_count is not null
  and tiktok_handle is not null;

-- Optional: a realistic per-campaign target for the screening stats.
update campaigns set target_influencer_count = 200 where target_influencer_count is null;
