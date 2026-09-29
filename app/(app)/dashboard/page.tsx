import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/avatar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import type { CandidateWithRelations, Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireRole("bazzaal");
  const supabase = createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    campaignsTotal,
    campaignsActive,
    applicationsToday,
    influencersTotal,
    pendingScreening,
    shipmentsInProgress,
    recentApplications,
    activeCampaigns,
    allCandidates,
  ] = await Promise.all([
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("campaign_candidates")
      .select("*", { count: "exact", head: true })
      .gte("applied_at", startOfDay.toISOString()),
    supabase.from("influencers").select("*", { count: "exact", head: true }),
    supabase
      .from("campaign_candidates")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("shipments")
      .select("*", { count: "exact", head: true })
      .in("status", ["preparing", "shipped"]),
    supabase
      .from("campaign_candidates")
      .select("*, influencers(*), campaigns(id, name, brand_name, status)")
      .order("applied_at", { ascending: false })
      .limit(5),
    supabase
      .from("campaigns")
      .select("*")
      .eq("status", "active")
      .order("start_date", { ascending: true }),
    supabase.from("campaign_candidates").select("campaign_id"),
  ]);

  const loadError =
    recentApplications.error?.message ??
    activeCampaigns.error?.message ??
    campaignsTotal.error?.message ??
    null;

  const countByCampaign = new Map<string, number>();
  for (const row of (allCandidates.data ?? []) as { campaign_id: string }[]) {
    countByCampaign.set(row.campaign_id, (countByCampaign.get(row.campaign_id) ?? 0) + 1);
  }

  const applications = (recentApplications.data ?? []) as CandidateWithRelations[];
  const campaigns = (activeCampaigns.data ?? []) as Campaign[];

  return (
    <>
      <PageHeader title="Dashboard" description="Live overview of campaign operations.">
        <RealtimeRefresh />
      </PageHeader>

      <div className="space-y-6 p-8">
        {loadError && <ErrorState message={loadError} />}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Total Campaigns" value={campaignsTotal.count ?? 0} />
          <MetricCard label="Active Campaigns" value={campaignsActive.count ?? 0} tone="success" />
          <MetricCard label="Applications Today" value={applicationsToday.count ?? 0} />
          <MetricCard label="Influencers Total" value={influencersTotal.count ?? 0} />
          <MetricCard
            label="Pending Screening"
            value={pendingScreening.count ?? 0}
            tone="warning"
            hint="Waiting for review"
          />
          <MetricCard
            label="Shipments In Progress"
            value={shipmentsInProgress.count ?? 0}
            hint="Preparing or shipped"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <Link
                href="/candidates"
                className="inline-flex items-center gap-1 text-2xs uppercase tracking-wider text-ink-faint transition-colors hover:text-accent"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            {applications.length === 0 ? (
              <EmptyState title="No applications yet" />
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <TR>
                      <TH>Influencer</TH>
                      <TH>Campaign</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Applied</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {applications.map((row) => (
                      <TR key={row.id}>
                        <TD>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.influencers?.full_name} size="sm" />
                            <div>
                              <p className="text-[13px] font-medium leading-tight">
                                {row.influencers?.full_name ?? "Unknown"}
                              </p>
                              <p className="text-2xs text-ink-faint">
                                {row.influencers?.instagram_handle}
                              </p>
                            </div>
                          </div>
                        </TD>
                        <TD className="max-w-[220px] truncate text-[13px] text-ink-muted">
                          {row.campaigns?.name ?? "—"}
                        </TD>
                        <TD>
                          <StatusBadge status={row.status} />
                        </TD>
                        <TD className="text-right text-[13px] text-ink-muted">
                          {timeAgo(row.applied_at)}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableWrap>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <Link
                href="/campaigns"
                className="inline-flex items-center gap-1 text-2xs uppercase tracking-wider text-ink-faint transition-colors hover:text-accent"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            {campaigns.length === 0 ? (
              <EmptyState title="No active campaigns" />
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <TR>
                      <TH>Campaign</TH>
                      <TH>Brand</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Candidates</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {campaigns.map((campaign) => (
                      <TR key={campaign.id}>
                        <TD className="max-w-[240px] truncate">
                          <Link
                            href={`/campaigns/${campaign.id}`}
                            className="text-[13px] font-medium transition-colors hover:text-accent"
                          >
                            {campaign.name}
                          </Link>
                        </TD>
                        <TD className="text-[13px] text-ink-muted">{campaign.brand_name}</TD>
                        <TD>
                          <StatusBadge status={campaign.status} />
                        </TD>
                        <TD className="text-right text-[13px] tabular-nums text-ink-muted">
                          {countByCampaign.get(campaign.id) ?? 0}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableWrap>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
