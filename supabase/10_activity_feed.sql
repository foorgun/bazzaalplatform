-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 10: Live activity feed
-- Safe to run on an existing database and safe to re-run.
-- ════════════════════════════════════════════════════════════

create table if not exists activity_feed (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  influencer_id uuid references influencers(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists activity_feed_created_idx on activity_feed (created_at desc);

-- ── Realtime ────────────────────────────────────────────────
-- Re-running the migration must not fail on an existing membership.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_feed'
  ) then
    alter publication supabase_realtime add table activity_feed;
  end if;
end
$$;

-- ── RLS ─────────────────────────────────────────────────────
-- The feed is an internal agency view: brands and creators must not read it.
alter table activity_feed enable row level security;

drop policy if exists "bazzaal: activity feed" on activity_feed;
create policy "bazzaal: activity feed" on activity_feed for all
  using ((select bz_role()) = 'bazzaal') with check ((select bz_role()) = 'bazzaal');

-- ── Seed ────────────────────────────────────────────────────
insert into activity_feed (type, message, created_at)
select * from (values
  ('approved', 'Ashley Carter was approved for Mixsoon Bean Essence',            now() - interval '18 minutes'),
  ('approved', 'Riley Thompson was approved for Mediheal Sheet Mask Fall 2026',  now() - interval '52 minutes'),
  ('rejected', 'Cameron Davis was rejected for SKIN1004 Madagascar Centella',    now() - interval '3 hours'),
  ('campaign', 'Mixsoon Heartleaf Serum was marked as Completed',                now() - interval '6 hours'),
  ('approved', 'Morgan Reed was approved for Mediheal Collagen Ampoule',         now() - interval '1 day')
) as seed(type, message, created_at)
where not exists (select 1 from activity_feed);
