import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate, formatFollowers } from "@/lib/utils";
import type { CandidateStatus, CandidateWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: CandidateStatus[] = ["pending", "approved", "rejected"];

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireRole("bazzaal");
  const supabase = createClient();

  const filter = STATUSES.includes(searchParams.status as CandidateStatus)
    ? (searchParams.status as CandidateStatus)
    : "all";

  const { data, error } = await supabase
    .from("campaign_candidates")
    .select("*, influencers(*), campaigns(id, name, brand_name, status)")
    .order("applied_at", { ascending: false });

  const all = (data ?? []) as CandidateWithRelations[];
  const rows = filter === "all" ? all : all.filter((r) => r.status === filter);

  return (
    <>
      <PageHeader
        title="Campaign Candidates"
        description="Every application across all campaigns."
      />

      <div className="space-y-4 p-8">
        {error && <ErrorState message={error.message} />}

        <FilterBar
          basePath="/candidates"
          current={filter}
          options={[
            { value: "all", label: "All", count: all.length },
            { value: "pending", label: "Pending", count: all.filter((r) => r.status === "pending").length },
            { value: "approved", label: "Approved", count: all.filter((r) => r.status === "approved").length },
            { value: "rejected", label: "Rejected", count: all.filter((r) => r.status === "rejected").length },
          ]}
        />

        <Card>
          {rows.length === 0 ? (
            <EmptyState title="No candidates" description="Nothing matches this filter." />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>Influencer Name</TH>
                    <TH>Campaign</TH>
                    <TH>Instagram</TH>
                    <TH className="text-right">Followers</TH>
                    <TH>Application Date</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
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
                      <TD className="max-w-[240px] truncate">
                        {row.campaigns ? (
                          <Link
                            href={`/campaigns/${row.campaigns.id}`}
                            className="text-[13px] text-ink-muted transition-colors hover:text-accent"
                          >
                            {row.campaigns.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TD>
                      <TD className="text-ink-muted">{row.influencers?.instagram_handle ?? "—"}</TD>
                      <TD className="text-right tabular-nums text-ink-muted">
                        {formatFollowers(row.influencers?.followers_count)}
                      </TD>
                      <TD className="text-ink-muted">{formatDate(row.applied_at)}</TD>
                      <TD>
                        <StatusBadge status={row.status} />
                      </TD>
                      <TD className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/influencers?highlight=${row.influencer_id}`}>
                            View Profile
                          </Link>
                        </Button>
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
