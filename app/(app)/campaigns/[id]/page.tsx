import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";
import { ProgressTracker } from "@/components/progress-tracker";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { EmptyState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate, formatFollowers } from "@/lib/utils";
import type { Campaign, CandidateWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  await requireRole("bazzaal");
  const supabase = createClient();

  const [campaignResult, candidatesResult] = await Promise.all([
    supabase.from("campaigns").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("campaign_candidates")
      .select("*, influencers(*), campaigns(id, name, brand_name, status)")
      .eq("campaign_id", params.id)
      .order("applied_at", { ascending: false }),
  ]);

  const campaign = campaignResult.data as Campaign | null;
  if (!campaign) notFound();

  const candidates = (candidatesResult.data ?? []) as CandidateWithRelations[];
  const approved = candidates.filter((c) => c.status === "approved").length;
  const pending = candidates.filter((c) => c.status === "pending").length;

  return (
    <>
      <div className="border-b border-hairline px-8 py-5">
        <Link
          href="/campaigns"
          className="mb-3 inline-flex items-center gap-1.5 text-2xs uppercase tracking-wider text-ink-faint transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3 w-3" /> Campaigns
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[17px] font-semibold tracking-tight text-ink">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <ActivityFeed />
        </div>
        <p className="mt-1 text-[13px] text-ink-muted">
          {campaign.brand_name} · {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)} ·{" "}
          {candidates.length} candidates · {approved} approved · {pending} pending
        </p>
        {campaign.description && (
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
            {campaign.description}
          </p>
        )}
      </div>

      <div className="space-y-4 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Setup</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            <Detail label="Client" value={campaign.client_name} />
            <Detail label="Month" value={campaign.month} />
            <Detail
              label="Min Followers"
              value={campaign.min_followers ? formatFollowers(campaign.min_followers) : null}
            />
            <Detail label="Platform" tags={campaign.platform} />
            <Detail label="Target Countries" tags={campaign.target_countries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Progress</CardTitle>
          </CardHeader>
          <ProgressTracker campaign={campaign} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
            <span className="text-2xs uppercase tracking-wider text-ink-faint">
              {candidates.length} total
            </span>
          </CardHeader>
          {candidates.length === 0 ? (
            <EmptyState
              title="No candidates yet"
              description="Applications for this campaign will show up here."
            />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>IG Handle</TH>
                    <TH className="text-right">Followers</TH>
                    <TH>Status</TH>
                    <TH>Notes</TH>
                  </TR>
                </THead>
                <TBody>
                  {candidates.map((row) => (
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
                      <TD>
                        <StatusBadge status={row.status} />
                      </TD>
                      <TD className="max-w-[320px] truncate whitespace-normal text-[13px] text-ink-muted">
                        {row.notes ?? "—"}
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

function Detail({
  label,
  value,
  tags,
}: {
  label: string;
  value?: string | null;
  tags?: string[] | null;
}) {
  return (
    <div>
      <p className="text-2xs uppercase tracking-wider text-ink-faint">{label}</p>
      {tags ? (
        tags.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} tone="neutral" dot={false}>
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[13px] text-ink-faint">Not set</p>
        )
      ) : (
        <p className="mt-1 text-[13px] text-ink">{value ?? <span className="text-ink-faint">Not set</span>}</p>
      )}
    </div>
  );
}
