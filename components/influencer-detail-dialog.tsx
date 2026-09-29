"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, formatDateTime, formatFollowers } from "@/lib/utils";
import { SCORE_TEXT_CLASS, scoreTone } from "@/lib/scoring";
import type { Campaign, CampaignCandidate, Influencer, Shipment } from "@/lib/types";

type CandidateRow = CampaignCandidate & {
  campaigns: Pick<Campaign, "id" | "name" | "brand_name" | "status"> | null;
};

type ShipmentRow = Shipment & { campaigns: Pick<Campaign, "id" | "name"> | null };

export function InfluencerDetailDialog({
  influencer,
  score,
}: {
  influencer: Influencer;
  score: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[90vh] max-w-5xl p-0">
        <DialogTitle className="sr-only">{influencer.full_name} profile</DialogTitle>
        {open && <Profile influencer={influencer} score={score} />}
      </DialogContent>
    </Dialog>
  );
}

function Profile({ influencer, score }: { influencer: Influencer; score: number }) {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [notes, setNotes] = useState(influencer.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(influencer.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(influencer.updated_at ?? influencer.created_at);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const [candidateResult, shipmentResult] = await Promise.all([
        supabase
          .from("campaign_candidates")
          .select("*, campaigns(id, name, brand_name, status)")
          .eq("influencer_id", influencer.id)
          .order("applied_at", { ascending: false }),
        supabase
          .from("shipments")
          .select("*, campaigns(id, name)")
          .eq("influencer_id", influencer.id)
          .order("updated_at", { ascending: false }),
      ]);

      if (cancelled) return;

      const message = candidateResult.error?.message ?? shipmentResult.error?.message ?? null;
      setLoadError(message);
      setCandidates((candidateResult.data ?? []) as CandidateRow[]);
      setShipments((shipmentResult.data ?? []) as ShipmentRow[]);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [influencer.id]);

  const saveNotes = useCallback(async () => {
    if (notes === savedNotes || saving) return;

    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("influencers")
      .update({ notes })
      .eq("id", influencer.id)
      .select("notes, updated_at")
      .single();

    setSaving(false);

    if (error) {
      // The notes column only exists after supabase/07_influencer_fields.sql.
      const missingColumn = error.code === "42703" || error.code === "PGRST204";
      toast.error("Could not save notes", {
        description: missingColumn
          ? "Run supabase/07_influencer_fields.sql to add the notes column."
          : error.message,
      });
      return;
    }

    setSavedNotes(data?.notes ?? notes);
    setUpdatedAt(data?.updated_at ?? new Date().toISOString());
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }, [notes, savedNotes, saving, influencer.id]);

  const dirty = notes !== savedNotes;
  const uniqueCampaigns = Array.from(
    new Map(
      candidates
        .filter((row) => row.campaigns)
        .map((row) => [row.campaigns!.id, row.campaigns!])
    ).values()
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline px-6 py-4 pr-14">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-ink">
            {influencer.full_name}
          </h2>
          <p className="truncate text-[13px] text-ink-muted">
            {influencer.instagram_handle ?? "—"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xs uppercase tracking-wider text-ink-faint">Last updated</p>
          <p className="mt-0.5 text-[13px] text-ink-muted">{formatDateTime(updatedAt)}</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr]">
        {/* ── Left ─────────────────────────────────────────── */}
        <div className="overflow-y-auto border-hairline p-6 lg:border-r">
          <div className="flex flex-col items-center text-center">
            <Avatar name={influencer.full_name} size="xl" />
            <p className="mt-3 text-sm font-semibold text-ink">{influencer.full_name}</p>
            <p className="text-[13px] text-ink-muted">{influencer.instagram_handle ?? "—"}</p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2.5 rounded-md border border-hairline bg-surface-2 px-3 py-2.5">
            <span className="text-2xs uppercase tracking-wider text-ink-faint">Score</span>
            <span className={cn("text-[22px] font-semibold leading-none tabular-nums", SCORE_TEXT_CLASS[scoreTone(score)])}>
              {score}
            </span>
            <span className="text-2xs text-ink-faint">/ 100</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-hairline bg-hairline">
            <Stat
              label="Engagement"
              value={influencer.engagement_rate ? `${influencer.engagement_rate.toFixed(1)}%` : "—"}
              success={(influencer.engagement_rate ?? 0) >= 5}
            />
            <Stat label="Followers" value={formatFollowers(influencer.followers_count)} />
            <Stat label="TikTok" value={influencer.tiktok_handle ?? "—"} small />
          </div>

          <div className="mt-4 rounded-md border border-hairline bg-surface-2 px-3 py-2.5">
            <p className="text-2xs uppercase tracking-wider text-ink-faint">Medians</p>
            <div className="mt-1.5 flex items-center gap-2 text-[13px] tabular-nums text-ink">
              <Median label="Likes" value={influencer.median_likes} />
              <span className="text-ink-faint">·</span>
              <Median label="Comments" value={influencer.median_comments} />
              <span className="text-ink-faint">·</span>
              <Median label="Views" value={influencer.median_views} />
            </div>
          </div>

          <dl className="mt-4 divide-y divide-hairline border-y border-hairline">
            <Row label="Email" value={influencer.email ?? "—"} />
            <Row label="Country" value={influencer.country ?? "—"} />
            <Row label="Niche" value={influencer.niche ?? "—"} />
            <Row label="Age Range" value={influencer.age_range ?? "—"} />
            <Row label="Ethnicity" value={influencer.ethnicity ?? "—"} />
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-[13px] text-ink-muted">Status</dt>
              <dd>
                <StatusBadge status={influencer.status} />
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <p className="text-2xs uppercase tracking-wider text-ink-faint">Campaigns</p>
            {loading ? (
              <div className="mt-2 space-y-1.5">
                <div className="skeleton h-7" />
                <div className="skeleton h-7" />
              </div>
            ) : uniqueCampaigns.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-faint">No campaigns yet</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {uniqueCampaigns.map((campaign) => (
                  <li
                    key={campaign.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-surface-2 px-2.5 py-1.5"
                  >
                    <span className="truncate text-[13px] text-ink">{campaign.name}</span>
                    <StatusBadge status={campaign.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right ────────────────────────────────────────── */}
        <div className="space-y-5 overflow-y-auto p-6">
          {loadError && <ErrorState message={loadError} />}

          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-ink">Notes</h3>
              <span className="flex items-center gap-2">
                {justSaved && !dirty && (
                  <span className="flex items-center gap-1 text-2xs uppercase tracking-wider text-success">
                    <Check className="h-3 w-3" strokeWidth={3} /> Saved
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={saveNotes} disabled={!dirty || saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Save
                </Button>
              </span>
            </div>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Internal notes on this creator — rate card, past performance, contact history…"
            />
            <p className="mt-1.5 text-2xs text-ink-faint">
              Saves automatically when you click away.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-ink">Campaign History</h3>
            <div className="rounded-lg border border-hairline bg-surface">
              {loading ? (
                <div className="space-y-2 p-4">
                  <div className="skeleton h-4" />
                  <div className="skeleton h-4 w-3/4" />
                </div>
              ) : candidates.length === 0 ? (
                <EmptyState title="No applications" className="py-10" />
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Campaign Name</TH>
                        <TH>Brand</TH>
                        <TH>Status</TH>
                        <TH className="text-right">Applied Date</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {candidates.map((row) => (
                        <TR key={row.id}>
                          <TD className="max-w-[240px] truncate text-[13px]">
                            {row.campaigns?.name ?? "—"}
                          </TD>
                          <TD className="text-[13px] text-ink-muted">
                            {row.campaigns?.brand_name ?? "—"}
                          </TD>
                          <TD>
                            <StatusBadge status={row.status} />
                          </TD>
                          <TD className="text-right text-[13px] text-ink-muted">
                            {formatDate(row.applied_at)}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </TableWrap>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-ink">Shipment Status</h3>
            {loading ? (
              <div className="skeleton h-16 rounded-lg" />
            ) : shipments.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface px-4 py-3.5">
                <Package className="h-4 w-4 text-ink-faint" />
                <p className="text-[13px] text-ink-muted">No shipment for this creator yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {shipment.campaigns?.name ?? "—"}
                      </p>
                      <p className="mt-0.5 font-mono text-[12px] text-ink-muted">
                        {shipment.tracking_number ?? "No tracking number"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral" dot={false}>
                        {shipment.carrier ?? "—"}
                      </Badge>
                      <StatusBadge status={shipment.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  success,
  small,
}: {
  label: string;
  value: string;
  success?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-surface-2 px-2.5 py-2">
      <p className="text-2xs uppercase tracking-wider text-ink-faint">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate font-medium tabular-nums",
          small ? "text-[12px]" : "text-[15px]",
          success ? "text-success" : "text-ink"
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function Median({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="font-medium">{value === null ? "—" : formatFollowers(value)}</span>
      <span className="text-2xs text-ink-faint">{label}</span>
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-[13px] text-ink-muted">{label}</dt>
      <dd className="truncate text-[13px] text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}
