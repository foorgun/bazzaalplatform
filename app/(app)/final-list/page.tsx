import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/ui/card";
import { ExportCsvButton } from "@/components/export-csv-button";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate, formatFollowers } from "@/lib/utils";
import type { FinalListWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FinalListPage() {
  await requireRole("bazzaal");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("final_list")
    .select(
      "*, influencers(id, full_name, instagram_handle, followers_count), campaigns(id, name, brand_name)"
    )
    .order("approved_at", { ascending: false });

  const rows = (data ?? []) as FinalListWithRelations[];

  return (
    <>
      <PageHeader
        title="Final List"
        description={`${rows.length} approved creators across all campaigns.`}
      >
        <ExportCsvButton
          filename="bazzaal-final-list.csv"
          headers={[
            "Name",
            "Instagram",
            "Campaign",
            "Brand",
            "Followers",
            "Approved Date",
            "Post Status",
            "Follow Up Round",
            "Follow Up Date",
          ]}
          rows={rows.map((row) => [
            row.influencers?.full_name ?? "",
            row.influencers?.instagram_handle ?? "",
            row.campaigns?.name ?? "",
            row.campaigns?.brand_name ?? "",
            row.influencers?.followers_count ?? "",
            formatDate(row.approved_at),
            row.post_status,
            row.follow_up_round ?? 0,
            row.follow_up_date ? formatDate(row.follow_up_date) : "",
          ])}
          disabled={rows.length === 0}
        />
      </PageHeader>

      <div className="space-y-4 p-8">
        {error && <ErrorState message={error.message} />}

        <Card>
          {rows.length === 0 ? (
            <EmptyState
              title="No approved creators yet"
              description="Approve candidates in Screening and they land here."
            />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>IG Handle</TH>
                    <TH>Campaign</TH>
                    <TH className="text-right">Followers</TH>
                    <TH>Approved Date</TH>
                    <TH>Post Status</TH>
                    <TH>Follow Up Round</TH>
                    <TH>Follow Up Date</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((row) => (
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
                      <TD className="max-w-[240px] truncate text-ink-muted">
                        {row.campaigns?.name ?? "—"}
                      </TD>
                      <TD className="text-right tabular-nums text-ink-muted">
                        {formatFollowers(row.influencers?.followers_count)}
                      </TD>
                      <TD className="text-ink-muted">{formatDate(row.approved_at)}</TD>
                      <TD>
                        <StatusBadge status={row.post_status} kind="post" />
                      </TD>
                      <TD>
                        <FollowUpRound round={row.follow_up_round} />
                      </TD>
                      <TD className="text-ink-muted">
                        {row.follow_up_date ? (
                          formatDate(row.follow_up_date)
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
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

/** Round 0 reads as "not followed up yet", so it stays gray. */
function FollowUpRound({ round }: { round: number | null }) {
  const value = round ?? 0;
  return (
    <Badge tone={value > 0 ? "accent" : "neutral"} dot={false}>
      Round {value}
    </Badge>
  );
}
