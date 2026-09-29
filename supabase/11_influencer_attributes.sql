-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 11: Influencer attributes
-- Niche / age range / ethnicity for the influencers toolbar.
-- Safe to run on an existing database and safe to re-run.
-- ════════════════════════════════════════════════════════════

alter table influencers add column if not exists niche     text;
alter table influencers add column if not exists age_range text;
alter table influencers add column if not exists ethnicity text;

-- Backfill the seeded roster.
update influencers i
set niche     = v.niche,
    age_range = v.age_range,
    ethnicity = v.ethnicity
from (values
  ('Ashley Carter',   'Skincare',  '25-30', 'Caucasian'),
  ('Jordan Mitchell', 'Beauty',    '22-27', 'African American'),
  ('Taylor Brooks',   'Lifestyle', '28-33', 'Caucasian'),
  ('Morgan Reed',     'Beauty',    '23-28', 'Latina'),
  ('Riley Thompson',  'Skincare',  '24-29', 'Asian American'),
  ('Cameron Davis',   'Lifestyle', '26-31', 'Caucasian'),
  ('Avery Williams',  'Beauty',    '21-26', 'African American'),
  ('Parker Johnson',  'Skincare',  '27-32', 'Caucasian'),
  ('Quinn Martinez',  'Wellness',  '25-30', 'Latina'),
  ('Sage Anderson',   'Lifestyle', '23-28', 'Caucasian'),
  ('Blake Wilson',    'Beauty',    '24-29', 'Mixed'),
  ('Drew Harris',     'Skincare',  '22-27', 'African American'),
  ('Reese Thompson',  'Wellness',  '28-33', 'Asian American'),
  ('Alex Morgan',     'Beauty',    '26-31', 'Caucasian'),
  ('Jamie Lee',       'Skincare',  '23-28', 'Asian American')
) as v(full_name, niche, age_range, ethnicity)
where i.full_name = v.full_name;
