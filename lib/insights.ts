import { influencerScore } from "@/lib/scoring";
import type { Influencer } from "@/lib/types";

export type Bucket = { label: string; value: number };

export const FOLLOWER_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "<100K", min: 0, max: 100_000 },
  { label: "100–250K", min: 100_000, max: 250_000 },
  { label: "250–500K", min: 250_000, max: 500_000 },
  { label: "500K+", min: 500_000, max: Number.POSITIVE_INFINITY },
];

export const ENGAGEMENT_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "<3%", min: 0, max: 3 },
  { label: "3–5%", min: 3, max: 5 },
  { label: "5–7%", min: 5, max: 7 },
  { label: ">7%", min: 7, max: Number.POSITIVE_INFINITY },
];

function bucketBy(
  influencers: Influencer[],
  buckets: { label: string; min: number; max: number }[],
  pick: (influencer: Influencer) => number
): Bucket[] {
  return buckets.map((bucket) => ({
    label: bucket.label,
    value: influencers.filter((influencer) => {
      const value = pick(influencer);
      return value >= bucket.min && value < bucket.max;
    }).length,
  }));
}

/** Counts per distinct value, largest first. Nulls collapse into "Unknown". */
function countBy(influencers: Influencer[], pick: (i: Influencer) => string | null): Bucket[] {
  const counts = new Map<string, number>();
  for (const influencer of influencers) {
    const key = pick(influencer) ?? "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildInsights(
  influencers: Influencer[],
  qualities: Map<string, (string | null)[]>
) {
  const total = influencers.length;

  const withEngagement = influencers.filter((i) => i.engagement_rate !== null);
  const avgEngagement =
    withEngagement.length > 0
      ? withEngagement.reduce((sum, i) => sum + (i.engagement_rate ?? 0), 0) / withEngagement.length
      : 0;

  const withFollowers = influencers.filter((i) => i.followers_count !== null);
  const avgFollowers =
    withFollowers.length > 0
      ? Math.round(
          withFollowers.reduce((sum, i) => sum + (i.followers_count ?? 0), 0) / withFollowers.length
        )
      : 0;

  const platform: Bucket[] = [
    {
      label: "Instagram + TikTok",
      value: influencers.filter((i) => i.instagram_handle && i.tiktok_handle).length,
    },
    {
      label: "Instagram only",
      value: influencers.filter((i) => i.instagram_handle && !i.tiktok_handle).length,
    },
    {
      label: "TikTok only",
      value: influencers.filter((i) => !i.instagram_handle && i.tiktok_handle).length,
    },
  ].filter((bucket) => bucket.value > 0);

  const topScores = influencers
    .map((influencer) => ({
      label: influencer.full_name,
      value: influencerScore(influencer, qualities.get(influencer.id) ?? []).score,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const countries = countBy(influencers, (i) => i.country);

  return {
    total,
    avgEngagement,
    avgFollowers,
    followerRange: bucketBy(influencers, FOLLOWER_BUCKETS, (i) => i.followers_count ?? 0),
    engagementRange: bucketBy(influencers, ENGAGEMENT_BUCKETS, (i) => i.engagement_rate ?? 0),
    niche: countBy(influencers, (i) => i.niche),
    ethnicity: countBy(influencers, (i) => i.ethnicity),
    ageRange: countBy(influencers, (i) => i.age_range).sort((a, b) =>
      a.label.localeCompare(b.label)
    ),
    platform,
    topScores,
    countries,
  };
}

export type Insights = ReturnType<typeof buildInsights>;
