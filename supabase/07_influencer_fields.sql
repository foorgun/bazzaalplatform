-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 07: Influencer profile fields
-- Backs the influencer detail modal.
-- Safe to run on an existing database and safe to re-run.
-- ════════════════════════════════════════════════════════════

alter table influencers add column if not exists notes            text;
alter table influencers add column if not exists median_likes     integer;
alter table influencers add column if not exists median_comments  integer;
alter table influencers add column if not exists median_views     integer;
alter table influencers add column if not exists updated_at       timestamptz default now();

-- "Last updated" in the modal header needs a column that actually moves.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists influencers_set_updated_at on influencers;
create trigger influencers_set_updated_at
  before update on influencers
  for each row execute function public.set_updated_at();

-- Optional: derive plausible medians for the seeded roster so the modal is
-- not full of dashes during the demo. Only fills rows that are still empty.
update influencers
set median_likes    = round(followers_count * (engagement_rate / 100.0) * 0.88),
    median_comments = greatest(round(followers_count * (engagement_rate / 100.0) * 0.06), 1),
    median_views    = round(followers_count * 1.35)
where median_likes is null
  and followers_count is not null
  and engagement_rate is not null;
