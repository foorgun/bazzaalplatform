"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Columns3, Filter, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/states";
import { cn, formatDate } from "@/lib/utils";
import type { Campaign, CampaignStatus } from "@/lib/types";

type ColumnKey = "brand" | "status" | "start_date" | "influencers" | "month" | "platform" | "client";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "brand", label: "Brand" },
  { key: "status", label: "Status" },
  { key: "start_date", label: "Start Date" },
  { key: "influencers", label: "Influencers" },
  { key: "month", label: "Month" },
  { key: "platform", label: "Platform" },
  { key: "client", label: "Client" },
];

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  brand: true,
  status: true,
  start_date: true,
  influencers: true,
  month: false,
  platform: false,
  client: false,
};

type Filters = { status: string; platform: string; minFollowers: string };
const DEFAULT_FILTERS: Filters = { status: "all", platform: "all", minFollowers: "" };

const COLUMNS_KEY = "bazzaal.campaigns.columns";
const FILTERS_KEY = "bazzaal.campaigns.filters";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
];

function readStored<T extends object>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

export function CampaignsTable({
  campaigns,
  candidateCounts,
  action,
}: {
  campaigns: Campaign[];
  candidateCounts: Record<string, number>;
  /** Rendered at the end of the toolbar — the Create Campaign button. */
  action?: React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted settings after mount so SSR and first paint stay in sync.
  useEffect(() => {
    setColumns(readStored(COLUMNS_KEY, DEFAULT_COLUMNS));
    setFilters(readStored(FILTERS_KEY, DEFAULT_FILTERS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns));
    } catch {
      // storage unavailable (private window) — settings just won't persist
    }
  }, [columns, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters, hydrated]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: campaigns.length };
    for (const campaign of campaigns) {
      counts[campaign.status] = (counts[campaign.status] ?? 0) + 1;
    }
    return counts;
  }, [campaigns]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const minFollowers = filters.minFollowers ? Number(filters.minFollowers) : null;

    return campaigns.filter((campaign) => {
      if (query && !campaign.name.toLowerCase().includes(query)) return false;
      if (filters.status !== "all" && campaign.status !== filters.status) return false;

      if (filters.platform !== "all") {
        const platforms = campaign.platform ?? [];
        if (filters.platform === "both") {
          if (!platforms.includes("Instagram") || !platforms.includes("TikTok")) return false;
        } else if (!platforms.includes(filters.platform)) {
          return false;
        }
      }

      if (minFollowers !== null && !Number.isNaN(minFollowers)) {
        if ((campaign.min_followers ?? -1) < minFollowers) return false;
      }

      return true;
    });
  }, [campaigns, search, filters]);

  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.platform !== "all" ? 1 : 0) +
    (filters.minFollowers ? 1 : 0);

  const hiddenColumnCount = COLUMNS.filter((column) => !columns[column.key]).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search — top left */}
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns…"
            className="h-9 pl-9 pr-8"
            aria-label="Search campaigns by name"
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

        <div className="flex items-center gap-2">
          {/* Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-3.5 w-3.5" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-accent-soft px-1.5 text-2xs tabular-nums text-accent">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4">
              <div className="space-y-4">
                <Segmented
                  label="Status"
                  value={filters.status}
                  onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
                  options={[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "draft", label: "Draft" },
                    { value: "completed", label: "Completed" },
                  ]}
                />

                <Segmented
                  label="Platform"
                  value={filters.platform}
                  onChange={(value) => setFilters((f) => ({ ...f, platform: value }))}
                  options={[
                    { value: "all", label: "All" },
                    { value: "Instagram", label: "Instagram" },
                    { value: "TikTok", label: "TikTok" },
                    { value: "both", label: "Both" },
                  ]}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="min-followers">Min Followers ≥</Label>
                  <Input
                    id="min-followers"
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    className="h-9"
                    placeholder="Any"
                    value={filters.minFollowers}
                    onChange={(e) => setFilters((f) => ({ ...f, minFollowers: e.target.value }))}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  disabled={activeFilterCount === 0}
                >
                  Reset filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Column visibility */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-3.5 w-3.5" />
                Columns
                {hiddenColumnCount > 0 && (
                  <span className="rounded-full bg-white/[0.06] px-1.5 text-2xs tabular-nums text-ink-muted">
                    {COLUMNS.length - hiddenColumnCount}/{COLUMNS.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1">
              <p className="px-2.5 py-1.5 text-2xs uppercase tracking-wider text-ink-faint">
                Toggle columns
              </p>
              {COLUMNS.map((column) => {
                const visible = columns[column.key];
                return (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() =>
                      setColumns((current) => ({ ...current, [column.key]: !current[column.key] }))
                    }
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left text-[13px] transition-colors",
                      visible ? "text-ink" : "text-ink-muted",
                      "hover:bg-white/[0.06] hover:text-ink"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                        visible ? "border-accent bg-accent text-black" : "border-white/20"
                      )}
                    >
                      {visible && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                    </span>
                    {column.label}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          {action}
        </div>
      </div>

      {/* Status tabs — same state as the Status filter above */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-hairline bg-surface p-1">
        {STATUS_TABS.map((tab) => {
          const active = filters.status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, status: tab.value }))}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-white/[0.07] font-medium text-ink"
                  : "text-ink-muted hover:bg-white/[0.03] hover:text-ink"
              )}
            >
              {tab.label}
              <span className="ml-1.5 tabular-nums text-ink-faint">
                {statusCounts[tab.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No campaigns"
            description={
              search || activeFilterCount > 0
                ? "Nothing matches your search and filters."
                : "Create your first campaign to get started."
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Campaign Name</TH>
                  {columns.brand && <TH>Brand</TH>}
                  {columns.client && <TH>Client</TH>}
                  {columns.month && <TH>Month</TH>}
                  {columns.platform && <TH>Platform</TH>}
                  {columns.status && <TH>Status</TH>}
                  {columns.start_date && <TH>Start Date</TH>}
                  {columns.influencers && <TH className="text-right">Influencers</TH>}
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((campaign) => (
                  <TR key={campaign.id}>
                    <TD>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="font-medium transition-colors hover:text-accent"
                      >
                        {campaign.name}
                      </Link>
                    </TD>
                    {columns.brand && <TD className="text-ink-muted">{campaign.brand_name}</TD>}
                    {columns.client && (
                      <TD className="text-ink-muted">{campaign.client_name ?? "—"}</TD>
                    )}
                    {columns.month && <TD className="text-ink-muted">{campaign.month ?? "—"}</TD>}
                    {columns.platform && (
                      <TD>
                        {campaign.platform && campaign.platform.length > 0 ? (
                          <span className="flex flex-wrap gap-1.5">
                            {campaign.platform.map((platform) => (
                              <Badge key={platform} tone="neutral" dot={false}>
                                {platform}
                              </Badge>
                            ))}
                          </span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </TD>
                    )}
                    {columns.status && (
                      <TD>
                        <StatusBadge status={campaign.status as CampaignStatus} />
                      </TD>
                    )}
                    {columns.start_date && (
                      <TD className="text-ink-muted">{formatDate(campaign.start_date)}</TD>
                    )}
                    {columns.influencers && (
                      <TD className="text-right tabular-nums text-ink-muted">
                        {candidateCounts[campaign.id] ?? 0}
                      </TD>
                    )}
                    <TD className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/campaigns/${campaign.id}`}>View</Link>
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <p className="text-2xs text-ink-faint">
        Showing {rows.length} of {campaigns.length} campaigns
      </p>
    </div>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1 rounded-md border border-hairline bg-surface p-1">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-sm px-2 py-1 text-[12px] transition-colors",
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-ink-muted hover:bg-white/[0.04] hover:text-ink"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
