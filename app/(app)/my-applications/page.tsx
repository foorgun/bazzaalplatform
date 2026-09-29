import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { CandidateWithRelations, Shipment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyApplicationsPage() {
  const profile = await requireRole("creator");
  const supabase = createClient();

  // RLS limits both queries to the influencer record linked to this account.
  const [applicationsResult, shipmentsResult] = await Promise.all([
    supabase
      .from("campaign_candidates")
      .select("*, influencers(*), campaigns(id, name, brand_name, status)")
      .order("applied_at", { ascending: false }),
    supabase.from("shipments").select("*"),
  ]);

  const applications = (applicationsResult.data ?? []) as CandidateWithRelations[];
  const shipments = (shipmentsResult.data ?? []) as Shipment[];
  const shipmentByCampaign = new Map(shipments.map((s) => [s.campaign_id, s]));

  const approved = applications.filter((a) => a.status === "approved").length;
  const pending = applications.filter((a) => a.status === "pending").length;

  return (
    <>
      <PageHeader
        title="My Applications"
        description={`Signed in as ${profile.full_name ?? profile.email}`}
      />

      <div className="space-y-6 p-8">
        {applicationsResult.error && <ErrorState message={applicationsResult.error.message} />}

        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Applications" value={applications.length} />
          <MetricCard label="Approved" value={approved} tone="success" />
          <MetricCard label="In Review" value={pending} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
          </CardHeader>
          {applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Once you apply to a campaign it shows up here with its live status."
            />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>Campaign</TH>
                    <TH>Brand</TH>
                    <TH>Status</TH>
                    <TH>Applied</TH>
                    <TH>Shipment</TH>
                    <TH>Tracking</TH>
                  </TR>
                </THead>
                <TBody>
                  {applications.map((row) => {
                    const shipment =
                      row.status === "approved" ? shipmentByCampaign.get(row.campaign_id) : undefined;

                    return (
                      <TR key={row.id}>
                        <TD className="font-medium">{row.campaigns?.name ?? "—"}</TD>
                        <TD className="text-ink-muted">{row.campaigns?.brand_name ?? "—"}</TD>
                        <TD>
                          <StatusBadge status={row.status} />
                        </TD>
                        <TD className="text-ink-muted">{formatDate(row.applied_at)}</TD>
                        <TD>
                          {row.status !== "approved" ? (
                            <span className="text-[13px] text-ink-faint">—</span>
                          ) : shipment ? (
                            <StatusBadge status={shipment.status} />
                          ) : (
                            <Badge tone="neutral">Not created</Badge>
                          )}
                        </TD>
                        <TD className="font-mono text-[12px] text-ink-muted">
                          {shipment?.tracking_number ?? "—"}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </TableWrap>
          )}
        </Card>
      </div>
    </>
  );
}
