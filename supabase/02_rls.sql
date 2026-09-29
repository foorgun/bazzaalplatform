-- ════════════════════════════════════════════════════════════
-- BAZZAAL Platform — 02: Row Level Security
-- Run after 01_schema.sql.
--
--   bazzaal → full access to everything
--   brand   → only own campaigns + approved influencers on them
--   creator → only own applications / own shipments
--
-- Every cross-table lookup goes through a SECURITY DEFINER helper
-- so policies never re-enter another table's policies (which would
-- trip Postgres' "infinite recursion detected in policy" check).
-- ════════════════════════════════════════════════════════════

-- ── Helpers ─────────────────────────────────────────────────
create or replace function public.bz_role()
returns text language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.bz_brand()
returns text language sql stable security definer set search_path = public as $$
  select brand_name from profiles where id = auth.uid()
$$;

-- A creator is linked to their influencer record by matching email.
create or replace function public.bz_influencer_id()
returns uuid language sql stable security definer set search_path = public as $$
  select i.id
  from influencers i
  join profiles p on lower(p.email) = lower(i.email)
  where p.id = auth.uid()
  limit 1
$$;

-- Campaigns owned by the signed-in brand.
create or replace function public.bz_brand_campaign_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select c.id from campaigns c where c.brand_name = (select bz_brand())
$$;

-- Campaigns the signed-in creator has applied to.
create or replace function public.bz_creator_campaign_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select cc.campaign_id
  from campaign_candidates cc
  where cc.influencer_id = (select bz_influencer_id())
$$;

-- Influencers approved on one of the signed-in brand's campaigns.
create or replace function public.bz_brand_influencer_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select distinct cc.influencer_id
  from campaign_candidates cc
  join campaigns c on c.id = cc.campaign_id
  where cc.status = 'approved'
    and c.brand_name = (select bz_brand())
$$;

grant execute on function
  public.bz_role,
  public.bz_brand,
  public.bz_influencer_id,
  public.bz_brand_campaign_ids,
  public.bz_creator_campaign_ids,
  public.bz_brand_influencer_ids
to authenticated;

-- ── Auto-create a profile on signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, brand_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'creator'),
    new.raw_user_meta_data ->> 'brand_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Enable RLS ──────────────────────────────────────────────
alter table profiles            enable row level security;
alter table campaigns           enable row level security;
alter table influencers         enable row level security;
alter table campaign_candidates enable row level security;
alter table shipments           enable row level security;
alter table final_list          enable row level security;

-- ── profiles ────────────────────────────────────────────────
create policy "own profile: read"   on profiles for select using (id = auth.uid());
create policy "own profile: update" on profiles for update using (id = auth.uid());
create policy "bazzaal: profiles"   on profiles for all
  using ((select bz_role()) = 'bazzaal') with check ((select bz_role()) = 'bazzaal');

-- ── campaigns ───────────────────────────────────────────────
create policy "bazzaal: campaigns" on campaigns for all
  using ((select bz_role()) = 'bazzaal') with check ((select bz_role()) = 'bazzaal');

create policy "brand: own campaigns" on campaigns for select
  using ((select bz_role()) = 'brand' and brand_name = (select bz_brand()));

create policy "creator: applied campaigns" on campaigns for select
  using ((select bz_role()) = 'creator' and id in (select bz_creator_campaign_ids()));

-- ── influencers ─────────────────────────────────────────────
create policy "bazzaal: influencers" on influencers for all
  using ((select bz_role()) = 'bazzaal') with check ((select bz_role()) = 'bazzaal');

create policy "creator: own influencer row" on influencers for select
  using ((select bz_role()) = 'creator' and id = (select bz_influencer_id()));

create policy "brand: approved influencers" on influencers for select
  using ((select bz_role()) = 'brand' and id in (select bz_brand_influencer_ids()));

-- ── campaign_candidates ─────────────────────────────────────
create policy "bazzaal: candidates" on campaign_candidates for all
  using ((select bz_role()) = 'bazzaal') with check ((select bz_role()) = 'bazzaal');

create policy "creator: own applications" on campaign_candidates for select
  using ((select bz_role()) = 'creator' and influencer_id = (select bz_influencer_id()));

create policy "brand: approved candidates" on campaign_candidates for select
  using (
    (select bz_role()) = 'brand'
    and status = 'approved'
    and campaign_id in (select bz_brand_campaign_ids())
  );

-- ── shipments ───────────────────────────────────────────────
create policy "bazzaal: shipments" on shipments for all
  using ((select bz_role()) = 'bazzaal') with check ((select bz_role()) = 'bazzaal');

create policy "creator: own shipments" on shipments for select
  using ((select bz_role()) = 'creator' and influencer_id = (select bz_influencer_id()));

create policy "brand: shipments on own campaigns" on shipments for select
  using ((select bz_role()) = 'brand' and campaign_id in (select bz_brand_campaign_ids()));

-- ── final_list ──────────────────────────────────────────────
create policy "bazzaal: final list" on final_list for all
  using ((select bz_role()) = 'bazzaal') with check ((select bz_role()) = 'bazzaal');

create policy "creator: own final list rows" on final_list for select
  using ((select bz_role()) = 'creator' and influencer_id = (select bz_influencer_id()));

create policy "brand: final list on own campaigns" on final_list for select
  using ((select bz_role()) = 'brand' and campaign_id in (select bz_brand_campaign_ids()));
