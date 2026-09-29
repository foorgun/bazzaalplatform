"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Columns3, Filter, Search, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { InfluencerDetailDialog } from "@/components/influencer-detail-dialog";
import { ScoreCell } from "@/components/score";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { cn, formatFollowers } from "@/lib/utils";
import type { Influencer } from "@/lib/types";

export type ScoredInfluencer = Influencer & { score: number };

type ColumnKey =
  | "instagram"
  | "tiktok"
  | "followers"
  | "engagement"
  | "country"
  | "status"
  | "score"
  | "niche"
  | "age_range";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "instagram", label: "Instagram Handle" },
  { key: "tiktok", label: "TikTok Handle" },
  { key: "followers", label: "Followers" },
  { key: "engagement", label: "Engagement Rate" },
  { key: "country", label: "Country" },
  { key: "status", label: "Status" },
  { key: "score", label: "Score" },
  { key: "niche", label: "Niche" },
  { key: "age_range", label: "Age Range" },
];

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  instagram: true,
  tiktok: true,
  followers: true,
  engagement: true,
  country: true,
  status: true,
  score: false,
  niche: false,
  age_range: false,
};

type Filters = { status: string; followers: string; engagement: string; niche: string };
const DEFAULT_FILTERS: Filters = {
  status: "all",
  followers: "all",
  engagement: "all",
  niche: "all",
};

const COLUMNS_KEY = "bazzaal.influencers.columns";
const FILTERS_KEY = "bazzaal.influencers.filters";

const FOLLOWER_BANDS: Record<string, [number, number]> = {
  "<100k": [0, 100_000],
  "100-250k": [100_000, 250_000],
  "250-500k": [250_000, 500_000],
  "500k+": [500_000, Number.POSITIVE_INFINITY],
};

const ENGAGEMENT_BANDS: Record<string, [number, number]> = {
  "<3": [0, 3],
  "3-5": [3, 5],
  "5-7": [5, 7],
  ">7": [7, Number.POSITIVE_INFINITY],
};

const NICHES = ["Skincare", "Beauty", "Lifestyle", "Wellness", "Fashion"];

function readStored<T extends object>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

export function InfluencersTable({
  influencers,
  highlight,
}: {
  influencers: ScoredInfluencer[];
  highlight?: string;
}) {
  const [search, setSearch] = useState("");
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [hydrated, setHydrated] = useState(false);

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
      // storage unavailable — settings just won't persist
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

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return influencers.filter((influencer) => {
      if (query) {
        const name = influencer.full_name.toLowerCase();
        const handle = influencer.instagram_handle?.toLowerCase() ?? "";
        if (!name.includes(query) && !handle.includes(query)) return false;
      }

      if (filters.status !== "all" && influencer.status !== filters.status) return false;

      if (filters.followers !== "all") {
        const band = FOLLOWER_BANDS[filters.followers];
        const value = influencer.followers_count ?? 0;
        if (!band || value < band[0] || value >= band[1]) return false;
      }

      if (filters.engagement !== "all") {
        const band = ENGAGEMENT_BANDS[filters.engagement];
        const value = influencer.engagement_rate ?? 0;
        if (!band || value < band[0] || value >= band[1]) return false;
      }

      if (filters.niche !== "all" && influencer.niche !== filters.niche) return false;

      return true;
    });
  }, [influencers, search, filters]);

  const activeFilterCount = Object.values(filters).filter((value) => value !== "all").length;
  const visibleCount = COLUMNS.filter((column) => columns[column.key]).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or IG handle…"
            className="h-9 pl-9 pr-8"
            aria-label="Search influencers"
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
            <PopoverContent align="end" className="w-72 p-4">
              <div className="space-y-4">
                <Segmented
                  label="Status"
                  value={filters.status}
                  onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
                  options={[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />

                <Segmented
                  label="Followers"
                  value={filters.followers}
                  onChange={(value) => setFilters((f) => ({ ...f, followers: value }))}
                  options={[
                    { value: "all", label: "All" },
                    { value: "<100k", label: "<100K" },
                    { value: "100-250k", label: "100–250K" },
                    { value: "250-500k", label: "250–500K" },
                    { value: "500k+", label: "500K+" },
                  ]}
                />

                <Segmented
                  label="Engagement Rate"
                  value={filters.engagement}
                  onChange={(value) => setFilters((f) => ({ ...f, engagement: value }))}
                  options={[
                    { value: "all", label: "All" },
                    { value: "<3", label: "<3%" },
                    { value: "3-5", label: "3–5%" },
                    { value: "5-7", label: "5–7%" },
                    { value: ">7", label: ">7%" },
                  ]}
                />

                <Segmented
                  label="Niche"
                  value={filters.niche}
                  onChange={(value) => setFilters((f) => ({ ...f, niche: value }))}
                  options={[
                    { value: "all", label: "All" },
                    ...NICHES.map((niche) => ({ value: niche, label: niche })),
                  ]}
                />

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

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-3.5 w-3.5" />
                Columns
                <span className="rounded-full bg-white/[0.06] px-1.5 text-2xs tabular-nums text-ink-muted">
                  {visibleCount + 1}/{COLUMNS.length + 1}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              <p className="px-2.5 py-1.5 text-2xs uppercase tracking-wider text-ink-faint">
                Toggle columns
              </p>

              {/* Full Name is the row identity — always shown. */}
              <div className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] text-ink-faint">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-white/20 bg-white/10">
                  <Check className="h-2.5 w-2.5" strokeWidth={4} />
                </span>
                Full Name
              </div>

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
        </div>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No influencers"
            description={
              search || activeFilterCount > 0
                ? "Nothing matches your search and filters."
                : "Run the seed SQL to load the demo roster."
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Full Name</TH>
                  {columns.instagram && <TH>Instagram</TH>}
                  {columns.tiktok && <TH>TikTok</TH>}
                  {columns.followers && <TH className="text-right">Followers</TH>}
                  {columns.engagement && <TH className="text-right">Engagement</TH>}
                  {columns.score && <TH>Score</TH>}
                  {columns.niche && <TH>Niche</TH>}
                  {columns.age_range && <TH>Age Range</TH>}
                  {columns.country && <TH>Country</TH>}
                  {columns.status && <TH>Status</TH>}
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((influencer) => (
                  <TR
                    key={influencer.id}
                    className={cn(highlight === influencer.id && "bg-accent-soft hover:bg-accent-soft")}
                  >
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={influencer.full_name} size="sm" />
                        <span className="text-[13px] font-medium">{influencer.full_name}</span>
                      </div>
                    </TD>
                    {columns.instagram && (
                      <TD className="text-ink-muted">{influencer.instagram_handle ?? "—"}</TD>
                    )}
                    {columns.tiktok && (
                      <TD className="text-ink-muted">{influencer.tiktok_handle ?? "—"}</TD>
                    )}
                    {columns.followers && (
                      <TD className="text-right tabular-nums">
                        {formatFollowers(influencer.followers_count)}
                      </TD>
                    )}
                    {columns.engagement && (
                      <TD
                        className={cn(
                          "text-right tabular-nums",
                          (influencer.engagement_rate ?? 0) >= 5 ? "text-success" : "text-ink-muted"
                        )}
                      >
                        {influencer.engagement_rate?.toFixed(1) ?? "—"}%
                      </TD>
                    )}
                    {columns.score && (
                      <TD>
                        <ScoreCell score={influencer.score} />
                      </TD>
                    )}
                    {columns.niche && (
                      <TD className="text-ink-muted">{influencer.niche ?? "—"}</TD>
                    )}
                    {columns.age_range && (
                      <TD className="text-ink-muted">{influencer.age_range ?? "—"}</TD>
                    )}
                    {columns.country && (
                      <TD className="text-ink-muted">{influencer.country ?? "—"}</TD>
                    )}
                    {columns.status && (
                      <TD>
                        <StatusBadge status={influencer.status} />
                      </TD>
                    )}
                    <TD className="text-right">
                      <InfluencerDetailDialog influencer={influencer} score={influencer.score} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <p className="text-2xs text-ink-faint">
        Showing {rows.length} of {influencers.length} influencers · sorted by score
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
