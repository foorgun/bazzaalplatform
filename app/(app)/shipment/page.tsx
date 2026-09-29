import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import type { ShipmentStatus, ShipmentWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: ShipmentStatus[] = ["preparing", "shipped", "delivered"];

export default async function ShipmentPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireRole("bazzaal");
  const supabase = createClient();

  const filter = STATUSES.includes(searchParams.status as ShipmentStatus)
    ? (searchParams.status as ShipmentStatus)
    : "all";

  const { data, error } = await supabase
    .from("shipments")
    .select("*, influencers(id, full_name, instagram_handle), campaigns(id, name, brand_name)")
    .order("updated_at", { ascending: false });

  const all = (data ?? []) as ShipmentWithRelations[];
  const rows = filter === "all" ? all : all.filter((r) => r.status === filter);

  return (
    <>
      <PageHeader title="Shipment" description="Product seeding across all active campaigns." />

      <div className="space-y-4 p-8">
        {error && <ErrorState message={error.message} />}

        <FilterBar
          basePath="/shipment"
          current={filter}
          options={[
            { value: "all", label: "All", count: all.length },
            { value: "preparing", label: "Preparing", count: all.filter((r) => r.status === "preparing").length },
            { value: "shipped", label: "Shipped", count: all.filter((r) => r.status === "shipped").length },
            { value: "delivered", label: "Delivered", count: all.filter((r) => r.status === "delivered").length },
          ]}
        />

        <Card>
          {rows.length === 0 ? (
            <EmptyState title="No shipments" description="Approved creators appear here once a shipment is created." />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>Influencer Name</TH>
                    <TH>Campaign</TH>
                    <TH>Tracking Number</TH>
                    <TH>Carrier</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Updated At</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((row) => (
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
                      <TD className="max-w-[240px] truncate text-ink-muted">
                        {row.campaigns?.name ?? "—"}
                      </TD>
                      <TD className="font-mono text-[12px] text-ink-muted">
                        {row.tracking_number ?? "—"}
                      </TD>
                      <TD>
                        <Badge tone="neutral" dot={false}>
                          {row.carrier ?? "—"}
                        </Badge>
                      </TD>
                      <TD>
                        <StatusBadge status={row.status} />
                      </TD>
                      <TD className="text-right text-ink-muted">{formatDateTime(row.updated_at)}</TD>
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
