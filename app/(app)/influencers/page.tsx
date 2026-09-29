import { PageHeader } from "@/components/page-header";
import { InfluencersTable, type ScoredInfluencer } from "@/components/influencers-table";
import { ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatFollowers } from "@/lib/utils";
import { influencerScore } from "@/lib/scoring";
import type { Influencer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InfluencersPage({
  searchParams,
}: {
  searchParams: { highlight?: string };
}) {
  await requireRole("bazzaal");
  const supabase = createClient();

  const [influencersResult, qualityResult] = await Promise.all([
    supabase.from("influencers").select("*"),
    // Content-quality ratings feed the score. Missing until 08 has been run,
    // in which case every influencer simply scores as unrated.
    supabase.from("campaign_candidates").select("influencer_id, ig_content_quality"),
  ]);

  const qualities = new Map<string, (string | null)[]>();
  for (const row of (qualityResult.data ?? []) as {
    influencer_id: string;
    ig_content_quality: string | null;
  }[]) {
    const list = qualities.get(row.influencer_id) ?? [];
    list.push(row.ig_content_quality);
    qualities.set(row.influencer_id, list);
  }

  const influencers: ScoredInfluencer[] = ((influencersResult.data ?? []) as Influencer[])
    .map((influencer) => ({
      ...influencer,
      score: influencerScore(influencer, qualities.get(influencer.id) ?? []).score,
    }))
    .sort((a, b) => b.score - a.score);

  const totalReach = influencers.reduce((sum, i) => sum + (i.followers_count ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Influencers"
        description={`${influencers.length} creators · ${formatFollowers(totalReach)} combined reach`}
      />

      <div className="space-y-4 p-8">
        {influencersResult.error && <ErrorState message={influencersResult.error.message} />}
        <InfluencersTable influencers={influencers} highlight={searchParams.highlight} />
      </div>
    </>
  );
}
