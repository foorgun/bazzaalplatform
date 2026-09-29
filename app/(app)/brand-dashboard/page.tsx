import { PageHeader } from "@/components/page-header";
import { CampaignRequestDialog } from "@/components/campaign-request-dialog";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { ProgressTracker } from "@/components/progress-tracker";
import { Avatar } from "@/components/avatar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate, formatFollowers } from "@/lib/utils";
import type { Campaign, CandidateWithRelations, FinalListRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrandDashboardPage() {
  const profile = await requireRole("brand");
  const supabase = createClient();

  // RLS already scopes every query below to this brand's own rows.
  const [campaignsResult, approvedResult, finalListResult] = await Promise.all([
    supabase.from("campaigns").select("*").order("start_date", { ascending: false }),
    supabase
      .from("campaign_candidates")
      .select("*, influencers(*), campaigns(id, name, brand_name, status)")
      .eq("status", "approved")
      .order("reviewed_at", { ascending: false }),
    supabase.from("final_list").select("*"),
  ]);

  const campaigns = (campaignsResult.data ?? []) as Campaign[];
  const approved = (approvedResult.data ?? []) as CandidateWithRelations[];
  const finalList = (finalListResult.data ?? []) as FinalListRow[];

  const postStatus = new Map(
    finalList.map((row) => [`${row.campaign_id}:${row.influencer_id}`, row.post_status])
  );

  const totalReach = approved.reduce(
    (sum, row) => sum + (row.influencers?.followers_count ?? 0),
    0
  );

  return (
    <>
      <PageHeader
        title={`${profile.brand_name ?? "Brand"} Dashboard`}
        description="Your campaigns and the creators approved for them."
      >
        <CampaignRequestDialog brandName={profile.brand_name} />
      </PageHeader>

      <div className="space-y-6 p-8">
        {campaignsResult.error && <ErrorState message={campaignsResult.error.message} />}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Your Campaigns" value={campaigns.length} />
          <MetricCard
            label="Active"
            value={campaigns.filter((c) => c.status === "active").length}
            tone="success"
          />
          <MetricCard label="Approved Creators" value={approved.length} />
          <MetricCard label="Combined Reach" value={formatFollowers(totalReach)} />
        </div>

        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle>{campaign.name}</CardTitle>
                <StatusBadge status={campaign.status} />
              </div>
              <span className="text-2xs uppercase tracking-wider text-ink-faint">
                {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
              </span>
            </CardHeader>
            <ProgressTracker campaign={campaign} />
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Approved Influencers</CardTitle>
            <span className="text-2xs uppercase tracking-wider text-ink-faint">
              {approved.length} creators
            </span>
          </CardHeader>
          {approved.length === 0 ? (
            <EmptyState
              title="No approved creators yet"
              description="BAZZAAL is still screening applications for your campaigns."
            />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>IG Handle</TH>
                    <TH className="text-right">Followers</TH>
                    <TH className="text-right">Engagement</TH>
                    <TH>Campaign</TH>
                    <TH>Post Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {approved.map((row) => (
                    <TR key={row.id}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={row.influencers?.full_name} size="sm" />
                          <span className="text-[13px] font-medium">
                            {row.influencers?.full_name ?? "Unknown"}
                          </span>
                        </div>
                      </TD>
                      <TD className="text-ink-muted">{row.influencers?.instagram_handle ?? "—"}</TD>
                      <TD className="text-right tabular-nums text-ink-muted">
                        {formatFollowers(row.influencers?.followers_count)}
                      </TD>
                      <TD className="text-right tabular-nums text-ink-muted">
                        {row.influencers?.engagement_rate?.toFixed(1) ?? "—"}%
                      </TD>
                      <TD className="max-w-[220px] truncate text-ink-muted">
                        {row.campaigns?.name ?? "—"}
                      </TD>
                      <TD>
                        <StatusBadge
                          status={postStatus.get(`${row.campaign_id}:${row.influencer_id}`) ?? "pending"}
                          kind="post"
                        />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          )}
        </Card>
      </div>
    </>
  );
}
