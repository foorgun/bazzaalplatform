-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 06: Final list follow-up fields
-- Adds follow-up tracking and reduces post_status to pending/posted.
-- Safe to run on an existing database and safe to re-run.
-- ════════════════════════════════════════════════════════════

alter table final_list add column if not exists follow_up_round integer default 0;
alter table final_list add column if not exists follow_up_date  date;

-- Range check added separately so re-runs don't fail on a duplicate name.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'final_list_follow_up_round_check') then
    alter table final_list add constraint final_list_follow_up_round_check
      check (follow_up_round between 0 and 5);
  end if;
end
$$;

-- post_status: drop the old check, migrate the data, then re-add the check.
-- The data has to move BEFORE the new constraint is added, otherwise adding it
-- fails while 'verified' rows are still present.
alter table final_list drop constraint if exists final_list_post_status_check;

update final_list set post_status = 'posted' where post_status = 'verified';

alter table final_list add constraint final_list_post_status_check
  check (post_status in ('pending', 'posted'));

-- Optional: give the seeded demo rows some follow-up history.
update final_list set follow_up_round = 2, follow_up_date = date '2026-10-15'
  where post_status = 'pending' and follow_up_round = 0
    and campaign_id in (select id from campaigns where status = 'active');

update final_list set follow_up_round = 1, follow_up_date = date '2026-08-12'
  where post_status = 'posted' and follow_up_round = 0
    and campaign_id in (select id from campaigns where status = 'completed');
