import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import {
  BreakdownDonut,
  BucketBarChart,
  ChartCard,
  RankedBarChart,
} from "@/components/insights-charts";
import { InsightsMap } from "@/components/insights-map";
import { ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { buildInsights } from "@/lib/insights";
import { formatFollowers } from "@/lib/utils";
import type { Influencer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  await requireRole("bazzaal");
  const supabase = createClient();

  const [influencersResult, qualityResult] = await Promise.all([
    supabase.from("influencers").select("*"),
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

  const data = buildInsights((influencersResult.data ?? []) as Influencer[], qualities);

  return (
    <>
      <PageHeader title="Insights" description="Influencer database overview" />

      <div className="space-y-4 p-8">
        {influencersResult.error && <ErrorState message={influencersResult.error.message} />}

        {/* Row 1 — headline numbers */}
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Total Influencers" value={data.total} />
          <MetricCard
            label="Average Engagement Rate"
            value={`${data.avgEngagement.toFixed(1)}%`}
            tone="success"
          />
          <MetricCard label="Average Follower Count" value={formatFollowers(data.avgFollowers)} />
        </div>

        {/* Row 2 */}
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Follower Range">
            <BucketBarChart data={data.followerRange} />
          </ChartCard>
          <ChartCard title="Engagement Rate Distribution">
            <BucketBarChart data={data.engagementRange} />
          </ChartCard>
        </div>

        {/* Row 3 */}
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Niche Breakdown">
            <BreakdownDonut data={data.niche} />
          </ChartCard>
          <ChartCard title="Ethnicity Breakdown">
            <BreakdownDonut data={data.ethnicity} />
          </ChartCard>
        </div>

        {/* Row 4 */}
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Age Range Distribution">
            <BucketBarChart data={data.ageRange} />
          </ChartCard>
          <ChartCard title="Platform Presence">
            <BreakdownDonut data={data.platform} />
          </ChartCard>
        </div>

        {/* Row 5 */}
        <ChartCard title="Top 5 Influencers by Score" subtitle="Score out of 100">
          <RankedBarChart data={data.topScores} />
        </ChartCard>

        {/* Row 6 */}
        <ChartCard title="Markets" subtitle="Where the roster sits today, and where it could go next">
          <InsightsMap countries={data.countries} />
        </ChartCard>
      </div>
    </>
  );
}
