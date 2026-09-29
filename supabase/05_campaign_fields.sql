-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 05: Extra campaign fields
-- Adds the columns used by the "Create Campaign" dialog.
-- Safe to run on an existing database and safe to re-run.
-- ════════════════════════════════════════════════════════════

alter table campaigns add column if not exists client_name      text;
alter table campaigns add column if not exists month            text;
alter table campaigns add column if not exists platform         text[] default '{}'::text[];
alter table campaigns add column if not exists target_countries text[] default '{}'::text[];
alter table campaigns add column if not exists min_followers    integer;

-- Month must be a full English month name when set.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_month_check'
  ) then
    alter table campaigns add constraint campaigns_month_check
      check (
        month is null or month in (
          'January','February','March','April','May','June',
          'July','August','September','October','November','December'
        )
      );
  end if;
end
$$;

-- Optional: backfill the seeded demo campaigns so the new fields are not empty.
update campaigns set client_name = 'Mixsoon',  month = 'October',   platform = '{Instagram,TikTok}', target_countries = '{US,CA,UK}', min_followers = 100000
  where name = 'Mixsoon Bean Essence Campaign' and client_name is null;
update campaigns set client_name = 'Mediheal', month = 'October',   platform = '{Instagram}',        target_countries = '{US,DE,FR}', min_followers = 80000
  where name = 'Mediheal Sheet Mask Fall 2026' and client_name is null;
update campaigns set client_name = 'SKIN1004', month = 'November',  platform = '{Instagram,TikTok}', target_countries = '{US,JP,KR}', min_followers = 150000
  where name = 'SKIN1004 Madagascar Centella' and client_name is null;
update campaigns set client_name = 'Mixsoon',  month = 'July',      platform = '{TikTok}',           target_countries = '{US}',       min_followers = 50000
  where name = 'Mixsoon Heartleaf Serum' and client_name is null;
update campaigns set client_name = 'Mediheal', month = 'October',   platform = '{Instagram,TikTok}', target_countries = '{US,UK,AU}', min_followers = 120000
  where name = 'Mediheal Collagen Ampoule' and client_name is null;
