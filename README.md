# BAZZAAL Platform — MVP Demo

Influencer campaign operations for beauty brands. Next.js 14 (App Router), Tailwind,
shadcn/ui-style components, Supabase (Auth + Postgres + Realtime). Dark mode only.

## 1. Environment

```bash
cp .env.local.example .env.local
```

Fill both values from **Supabase Dashboard → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Restart the dev server after editing `.env.local`.

## 2. Database

Run these in the **Supabase SQL Editor**, in order:

| File | What it does |
| --- | --- |
| `supabase/01_schema.sql` | Tables, indexes, realtime publication on `campaign_candidates` |
| `supabase/02_rls.sql` | RLS policies per role + profile-on-signup trigger |
| `supabase/03_seed.sql` | 5 campaigns, 15 influencers, 22 candidates (10 pending), 8 shipments, final list |
| `supabase/04_demo_users.sql` | Assigns roles — **create the 3 auth users first** (see below) |
| `supabase/05_campaign_fields.sql` | Adds `client_name`, `month`, `platform`, `target_countries`, `min_followers` to `campaigns` (needed by the Create Campaign dialog) |
| `supabase/06_finallist_fields.sql` | Adds `follow_up_round` / `follow_up_date` to `final_list`, reduces `post_status` to pending/posted |
| `supabase/07_influencer_fields.sql` | Adds `notes`, median stats and `updated_at` (+ trigger) to `influencers` for the profile modal |
| `supabase/08_screening_fields.sql` | Adds screening rating fields to `campaign_candidates`, `target_influencer_count` to `campaigns`, `tiktok_followers` to `influencers` |
| `supabase/09_campaign_requests.sql` | Creates `campaign_requests` (+ RLS) for brand-submitted campaign briefs |
| `supabase/10_activity_feed.sql` | Creates `activity_feed` (+ RLS, realtime, seed) for the live activity panel |
| `supabase/11_influencer_attributes.sql` | Adds `niche`, `age_range`, `ethnicity` to `influencers` and backfills the 15 seeded creators |

Before running `04_demo_users.sql`, create these users under
**Authentication → Users → Add user** with *Auto Confirm User* ticked:

| Email | Password | Role |
| --- | --- | --- |
| `admin@bazzaal.demo` | `bazzaal2026` | bazzaal (full access) |
| `brand@mixsoon.demo` | `bazzaal2026` | brand (Mixsoon only) |
| `creator@bazzaal.demo` | `bazzaal2026` | creator (Ashley Carter) |

The login screen has one-click buttons that prefill each demo account.

## 3. Logo

Drop your file at `public/logo.png`. Until it exists, the sidebar falls back to the
"BAZZAAL" wordmark — nothing breaks.

## 4. Run

```bash
npm install
npm run dev     # http://localhost:3000
```

## Routes

| Route | Role | Notes |
| --- | --- | --- |
| `/login` | — | Email + password, redirects by role |
| `/dashboard` | bazzaal | 6 live metrics + recent applications + active campaigns |
| `/campaigns` | bazzaal | Filter: All / Active / Draft / Completed + Create Campaign dialog |
| `/campaigns/[id]` | bazzaal | 5-step progress tracker + candidate table |
| `/candidates` | bazzaal | All applications, filterable |
| `/influencers` | bazzaal | Full roster with search / filters / column toggles + profile modal |
| `/insights` | bazzaal | Roster analytics — distributions, breakdowns, top scores, market map |
| `/screening` | bazzaal | Two-panel workspace: campaign groups left, full screening detail + ratings right |
| `/shipment` | bazzaal | Tracking numbers, DHL / ShipHero |
| `/final-list` | bazzaal | Approved creators, follow-up tracking + CSV export |
| `/brand-dashboard` | brand | Own campaigns + approved creators, plus the Request Campaign dialog |
| `/brand-shipments` | brand | Read-only shipments for own campaigns, with search |
| `/my-applications` | creator | Own applications + shipment status |
| `/settings` | all | Account + logout |

## Create Campaign

The button in the top right of `/campaigns` opens a shadcn Dialog with name, brand,
client, month, start date, platform (multi), target countries (searchable multi) and
min followers. Name and brand are required; the campaign is saved as a `draft` and the
list refreshes in place with a success toast.

If `05_campaign_fields.sql` has not been run, the insert falls back to the base columns
and the toast says which fields were dropped — nothing errors out.

## Table toolbars

Campaigns and Influencers share the same pattern: search on the left, Filter and Columns
popovers on the right, both persisted in `localStorage`.

## Campaigns toolbar

Search (client-side, by campaign name), a Filter popover (status, platform, min followers)
and a Columns popover that shows/hides Brand, Status, Start Date, Influencers, Month,
Platform and Client. Month, Platform and Client are off by default. Both column visibility
and filter state persist in `localStorage` under `bazzaal.campaigns.columns` and
`bazzaal.campaigns.filters`. The status tabs and the Status filter share one state.

## Live activity feed

A bell in the page header (agency role only) opens a slide-in panel of recent events.
Approvals, rejections and new campaigns write a row to `activity_feed`; the panel
subscribes to inserts, so entries appear without a refresh. "Mark all read" flips the
`read` flag for everything currently listed.

## Insights

Every figure on `/insights` is computed from the live database, not hardcoded — the
page tracks the roster as it changes. Charts use recharts; the market map uses
react-simple-maps against `public/world-110m.json` (bundled locally, so the page has no
runtime dependency on a CDN).

Chart colours: single-series bars use `#939742`, one step darker than the brand accent so
it sits inside the lightness band for dark surfaces. Donut segments use a categorical
palette validated for colour-vision separation, and every segment is directly labelled
with its name, count and share, so identity never rests on colour alone.

## Influencer score

`lib/scoring.ts` computes a 0–100 score on the fly — engagement (max 40), reach (max 30)
and average IG content quality (max 30, neutral 15 when unrated). Shown in the influencers
table (sorted by score), the profile modal, and both screening views.

## Screening views

List View is the two-panel workspace. Card View shows one pending candidate at a time with
keyboard shortcuts: `A` approve, `R` reject, `→` skip. Skipped candidates come back around
before the queue is considered done.

## Realtime

`campaign_candidates` is in the `supabase_realtime` publication. The dashboard subscribes
to it, so approving a candidate in the screening workspace updates the dashboard metrics in
another tab without a reload. The screening page itself does not subscribe — an incoming
refresh would overwrite ratings being typed.

## Deploy (Vercel)

1. Push the repo to GitHub, import it in Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
3. Deploy — no other configuration needed.
