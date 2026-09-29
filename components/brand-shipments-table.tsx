"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { ShipmentWithRelations } from "@/lib/types";

export function BrandShipmentsTable({ shipments }: { shipments: ShipmentWithRelations[] }) {
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return shipments;
    return shipments.filter((row) => {
      const name = row.influencers?.full_name?.toLowerCase() ?? "";
      const campaign = row.campaigns?.name?.toLowerCase() ?? "";
      return name.includes(query) || campaign.includes(query);
    });
  }, [shipments, search]);

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search influencer or campaign…"
          className="h-9 pl-9 pr-8"
          aria-label="Search shipments"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint transition-colors hover:text-ink"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No shipments"
            description={
              search
                ? "Nothing matches your search."
                : "Shipments appear here once BAZZAAL sends product to your approved creators."
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Influencer</TH>
                  <TH>Campaign Name</TH>
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

      <p className="text-2xs text-ink-faint">
        Showing {rows.length} of {shipments.length} shipments
      </p>
    </div>
  );
}
