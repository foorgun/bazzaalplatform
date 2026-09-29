-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 03: Seed data
-- Run after 02_rls.sql. Safe to re-run (wipes demo rows first).
-- ════════════════════════════════════════════════════════════

truncate final_list, shipments, campaign_candidates, influencers, campaigns restart identity cascade;

-- ── Campaigns ───────────────────────────────────────────────
insert into campaigns (name, brand_name, status, start_date, end_date, description,
                       guidelines_sent_at, shared_with_client_at, shipment_created_at,
                       content_posted_at, completed_at) values
('Mixsoon Bean Essence Campaign', 'Mixsoon',  'active',    '2026-10-01', '2026-11-15',
 'Hero launch for the Bean Essence in the US market. 12 creators, IG Reels + TikTok.',
 '2026-10-02', '2026-10-05', null, null, null),

('Mediheal Sheet Mask Fall 2026', 'Mediheal', 'active',    '2026-09-28', '2026-11-30',
 'Seasonal sheet mask push. Focus on routine and before/after content.',
 '2026-10-01', '2026-10-03', null, null, null),

('SKIN1004 Madagascar Centella',  'SKIN1004', 'draft',     '2026-11-01', '2026-12-20',
 'Centella Ampoule awareness campaign. Creator list still being assembled.',
 null, null, null, null, null),

('Mixsoon Heartleaf Serum',       'Mixsoon',  'completed', '2026-07-01', '2026-08-30',
 'Heartleaf Serum summer campaign. Fully shipped, posted and reported.',
 '2026-07-02', '2026-07-05', '2026-07-12', '2026-08-01', '2026-08-30'),

('Mediheal Collagen Ampoule',     'Mediheal', 'active',    '2026-10-10', '2026-12-01',
 'Collagen Ampoule launch. Guidelines just went out to the creator pool.',
 '2026-10-08', null, null, null, null);

-- ── Influencers ─────────────────────────────────────────────
-- NOTE: Ashley Carter's email matches the demo creator login so the
--       Creator dashboard has real data behind it.
insert into influencers (full_name, instagram_handle, tiktok_handle, followers_count, engagement_rate, country, email, status) values
('Ashley Carter',   '@ashleybeauty',     '@ashleybeautytok', 245000, 4.2, 'US', 'creator@bazzaal.demo',        'active'),
('Jordan Mitchell', '@jordanskincare',   '@jordanski',       189000, 5.8, 'US', 'jordan@creators.demo',        'active'),
('Taylor Brooks',   '@taylorglowup',     '@taylorglow',      312000, 3.1, 'UK', 'taylor@creators.demo',        'active'),
('Morgan Reed',     '@morganbeautyco',   '@morganbeauty',     98000, 7.2, 'US', 'morgan@creators.demo',        'active'),
('Riley Thompson',  '@rileyskincare',    '@rileysk',         156000, 4.9, 'CA', 'riley@creators.demo',         'active'),
('Cameron Davis',   '@camerondavis',     '@camerondavistok', 287000, 2.8, 'US', 'cameron@creators.demo',       'active'),
('Avery Williams',  '@averyglow',        '@averyglowtok',    421000, 3.6, 'US', 'avery@creators.demo',         'active'),
('Parker Johnson',  '@parkerjbeauty',    '@parkerj',         134000, 6.1, 'DE', 'parker@creators.demo',        'active'),
('Quinn Martinez',  '@quinnbeauty',      '@quinnbtok',        78000, 8.4, 'US', 'quinn@creators.demo',         'active'),
('Sage Anderson',   '@sageandbeauty',    '@sagea',           203000, 4.5, 'US', 'sage@creators.demo',          'active'),
('Blake Wilson',    '@blakeskinfirst',   '@blakesk',         167000, 5.2, 'AU', 'blake@creators.demo',         'active'),
('Drew Harris',     '@drewglow',         '@drewglowtok',     445000, 2.9, 'US', 'drew@creators.demo',          'active'),
('Reese Thompson',  '@reeseskincare',    '@reeseski',         92000, 7.8, 'US', 'reese@creators.demo',         'active'),
('Alex Morgan',     '@alexmorganbeauty', '@alexmb',          378000, 3.3, 'UK', 'alex@creators.demo',          'inactive'),
('Jamie Lee',       '@jamieleebeauty',   '@jamieltok',       214000, 4.7, 'KR', 'jamie@creators.demo',         'active');

-- ── Candidates ──────────────────────────────────────────────
-- 10 pending (screening demo), 8 approved, 4 rejected.
insert into campaign_candidates (campaign_id, influencer_id, status, applied_at, reviewed_at, notes)
select c.id, i.id, v.status, v.applied_at, v.reviewed_at, v.notes
from (values
  -- pending
  ('Mixsoon Bean Essence Campaign', 'Ashley Carter',   'pending',  now() - interval '3 hours', null::timestamptz, 'Strong skincare-first feed, high save rate.'),
  ('Mixsoon Bean Essence Campaign', 'Jordan Mitchell', 'pending',  now() - interval '5 hours', null, 'Applied via the creator form.'),
  ('Mixsoon Bean Essence Campaign', 'Avery Williams',  'pending',  now() - interval '1 day',   null, 'Largest reach in the pool — check rate card.'),
  ('Mediheal Sheet Mask Fall 2026', 'Taylor Brooks',   'pending',  now() - interval '2 hours', null, 'UK based, good fit for EU shipping.'),
  ('Mediheal Sheet Mask Fall 2026', 'Morgan Reed',     'pending',  now() - interval '1 day',   null, 'Highest engagement rate of the batch.'),
  ('Mediheal Sheet Mask Fall 2026', 'Parker Johnson',  'pending',  now() - interval '2 days',  null, 'DE audience, needs German captions.'),
  ('Mediheal Collagen Ampoule',     'Riley Thompson',  'pending',  now() - interval '4 hours', null, 'Repeat creator from Q2.'),
  ('Mediheal Collagen Ampoule',     'Cameron Davis',   'pending',  now() - interval '2 days',  null, 'Reach is good, engagement below target.'),
  ('Mediheal Collagen Ampoule',     'Quinn Martinez',  'pending',  now() - interval '6 hours', null, 'Micro creator, 8.4% ER.'),
  ('SKIN1004 Madagascar Centella',  'Sage Anderson',   'pending',  now() - interval '3 days',  null, 'Early interest, campaign still in draft.'),
  -- approved
  ('Mixsoon Bean Essence Campaign', 'Blake Wilson',    'approved', now() - interval '6 days',  now() - interval '4 days', 'Approved — contract signed.'),
  ('Mixsoon Bean Essence Campaign', 'Drew Harris',     'approved', now() - interval '7 days',  now() - interval '4 days', 'Approved for Reels only.'),
  ('Mediheal Sheet Mask Fall 2026', 'Reese Thompson',  'approved', now() - interval '8 days',  now() - interval '6 days', 'Approved — great ER.'),
  ('Mediheal Sheet Mask Fall 2026', 'Alex Morgan',     'approved', now() - interval '9 days',  now() - interval '6 days', 'Approved, UK shipment.'),
  ('Mediheal Collagen Ampoule',     'Morgan Reed',     'approved', now() - interval '5 days',  now() - interval '3 days', 'Approved across both campaigns.'),
  ('Mixsoon Heartleaf Serum',       'Jamie Lee',       'approved', now() - interval '80 days', now() - interval '78 days', 'Completed campaign.'),
  ('Mixsoon Heartleaf Serum',       'Ashley Carter',   'approved', now() - interval '82 days', now() - interval '79 days', 'Completed campaign, top performer.'),
  ('Mixsoon Heartleaf Serum',       'Taylor Brooks',   'approved', now() - interval '81 days', now() - interval '78 days', 'Completed campaign.'),
  -- rejected
  ('Mixsoon Bean Essence Campaign', 'Quinn Martinez',  'rejected', now() - interval '6 days',  now() - interval '5 days', 'Audience overlap too low.'),
  ('Mixsoon Bean Essence Campaign', 'Jamie Lee',       'rejected', now() - interval '6 days',  now() - interval '5 days', 'Already booked on Heartleaf.'),
  ('Mediheal Sheet Mask Fall 2026', 'Cameron Davis',   'rejected', now() - interval '7 days',  now() - interval '5 days', 'Engagement below 3% threshold.'),
  ('Mediheal Collagen Ampoule',     'Reese Thompson',  'rejected', now() - interval '4 days',  now() - interval '3 days', 'Conflicting brand partnership.')
) as v(campaign_name, influencer_name, status, applied_at, reviewed_at, notes)
join campaigns   c on c.name = v.campaign_name
join influencers i on i.full_name = v.influencer_name;

-- ── Shipments (one per approved candidate) ──────────────────
insert into shipments (campaign_id, influencer_id, tracking_number, carrier, status, updated_at)
select c.id, i.id, v.tracking_number, v.carrier, v.status, v.updated_at
from (values
  ('Mixsoon Bean Essence Campaign', 'Blake Wilson',   'DHL-4471029835', 'DHL',      'shipped',   now() - interval '1 day'),
  ('Mixsoon Bean Essence Campaign', 'Drew Harris',    'SH-88213004',    'ShipHero', 'preparing', now() - interval '4 hours'),
  ('Mediheal Sheet Mask Fall 2026', 'Reese Thompson', 'DHL-4471030112', 'DHL',      'delivered', now() - interval '3 days'),
  ('Mediheal Sheet Mask Fall 2026', 'Alex Morgan',    'DHL-4471030449', 'DHL',      'shipped',   now() - interval '2 days'),
  ('Mediheal Collagen Ampoule',     'Morgan Reed',    'SH-88213077',    'ShipHero', 'preparing', now() - interval '2 hours'),
  ('Mixsoon Heartleaf Serum',       'Jamie Lee',      'DHL-4470891220', 'DHL',      'delivered', now() - interval '70 days'),
  ('Mixsoon Heartleaf Serum',       'Ashley Carter',  'DHL-4470891221', 'DHL',      'delivered', now() - interval '70 days'),
  ('Mixsoon Heartleaf Serum',       'Taylor Brooks',  'SH-88190455',    'ShipHero', 'delivered', now() - interval '69 days')
) as v(campaign_name, influencer_name, tracking_number, carrier, status, updated_at)
join campaigns   c on c.name = v.campaign_name
join influencers i on i.full_name = v.influencer_name;

-- ── Final list (mirrors approved candidates) ────────────────
insert into final_list (campaign_id, influencer_id, approved_at, post_status, follow_up_round, follow_up_date)
select cc.campaign_id,
       cc.influencer_id,
       cc.reviewed_at,
       case
         when c.name in ('Mixsoon Heartleaf Serum', 'Mediheal Sheet Mask Fall 2026') then 'posted'
         else 'pending'
       end,
       case
         when c.name = 'Mixsoon Heartleaf Serum' then 1
         when c.name = 'Mediheal Sheet Mask Fall 2026' then 0
         else 2
       end,
       case
         when c.name = 'Mixsoon Heartleaf Serum' then date '2026-08-12'
         when c.name = 'Mediheal Sheet Mask Fall 2026' then null
         else date '2026-10-15'
       end
from campaign_candidates cc
join campaigns c on c.id = cc.campaign_id
where cc.status = 'approved';
