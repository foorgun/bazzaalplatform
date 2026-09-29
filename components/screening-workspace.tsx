"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  List,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { StatusBadge } from "@/components/status-badge";
import { ScoreBadge } from "@/components/score";
import { ScreeningCardMode } from "@/components/screening-card-mode";
import { EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { CONTENT_STYLES } from "@/lib/campaign-options";
import { logActivity } from "@/lib/activity";
import { influencerScore } from "@/lib/scoring";
import { cn, formatFollowers } from "@/lib/utils";
import type { ScreeningCandidate } from "@/lib/types";

const QUALITY_OPTIONS = ["Poor", "Average", "Good", "Excellent"];

/** Postgres / PostgREST codes for "that column does not exist". */
const MISSING_COLUMN = new Set(["42703", "PGRST204"]);
const STATUS_ORDER: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };

export function ScreeningWorkspace({
  initialCandidates,
  userEmail,
}: {
  initialCandidates: ScreeningCandidate[];
  userEmail: string | null;
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCandidates.find((c) => c.status === "pending")?.id ?? initialCandidates[0]?.id ?? null
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<"list" | "card">("list");
  const [busyField, setBusyField] = useState<string | null>(null);

  const groups = useMemo(() => {
    const byCampaign = new Map<string, { name: string; brand: string; rows: ScreeningCandidate[] }>();
    for (const candidate of candidates) {
      const id = candidate.campaign_id;
      if (!byCampaign.has(id)) {
        byCampaign.set(id, {
          name: candidate.campaigns?.name ?? "Unassigned",
          brand: candidate.campaigns?.brand_name ?? "—",
          rows: [],
        });
      }
      byCampaign.get(id)!.rows.push(candidate);
    }
    // Still-to-screen first, then decided.
    Array.from(byCampaign.values()).forEach((group) => {
      group.rows.sort(
        (a: ScreeningCandidate, b: ScreeningCandidate) =>
          (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      );
    });
    return Array.from(byCampaign.entries());
  }, [candidates]);

  const scores = useMemo(() => {
    const qualities = new Map<string, (string | null)[]>();
    for (const candidate of candidates) {
      const list = qualities.get(candidate.influencer_id) ?? [];
      list.push(candidate.ig_content_quality);
      qualities.set(candidate.influencer_id, list);
    }

    const result = new Map<string, number>();
    for (const candidate of candidates) {
      if (result.has(candidate.influencer_id) || !candidate.influencers) continue;
      result.set(
        candidate.influencer_id,
        influencerScore(candidate.influencers, qualities.get(candidate.influencer_id) ?? []).score
      );
    }
    return result;
  }, [candidates]);

  const selected = candidates.find((c) => c.id === selectedId) ?? null;
  const pending = useMemo(() => candidates.filter((c) => c.status === "pending"), [candidates]);

  const stats = useMemo(() => {
    if (!selected) return { approved: 0, target: 0, shortlisted: 0 };
    const peers = candidates.filter((c) => c.campaign_id === selected.campaign_id);
    return {
      approved: peers.filter((c) => c.status === "approved").length,
      target: selected.campaigns?.target_influencer_count ?? 0,
      shortlisted: peers.filter((c) => c.status === "pending").length,
    };
  }, [candidates, selected]);

  /** Writes one or more fields for a candidate and mirrors them locally. */
  const patch = useCallback(
    async (id: string, fields: Partial<ScreeningCandidate>, fieldKey: string) => {
      setBusyField(fieldKey);

      // Optimistic — the form should never feel like it lags behind a click.
      setCandidates((current) =>
        current.map((c) => (c.id === id ? { ...c, ...fields } : c))
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("campaign_candidates")
        .update({ ...fields, last_modified_by: userEmail })
        .eq("id", id);

      setBusyField(null);

      if (error) {
        toast.error("Could not save", {
          description: MISSING_COLUMN.has(error.code ?? "")
            ? "Run supabase/08_screening_fields.sql to add the screening columns."
            : error.message,
        });
      }
    },
    [userEmail]
  );

  async function decide(candidate: ScreeningCandidate, status: "approved" | "rejected") {
    await patch(
      candidate.id,
      { status, reviewed_at: new Date().toISOString() },
      `decision:${candidate.id}`
    );

    const who = candidate.influencers?.full_name ?? "A candidate";
    const where = candidate.campaigns?.name ?? "a campaign";
    void logActivity(createClient(), {
      type: status,
      message: `${who} was ${status} for ${where}`,
      influencer_id: candidate.influencer_id,
      campaign_id: candidate.campaign_id,
    });
  }

  if (candidates.length === 0) {
    return (
      <div className="card m-8">
        <EmptyState
          title="Nothing to screen"
          description="Applications appear here as creators apply to campaigns."
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-6 py-2.5">
        <p className="text-2xs uppercase tracking-wider text-ink-faint">
          {pending.length} pending · {candidates.length} total
        </p>
        <div className="flex items-center gap-0.5 rounded-md border border-hairline bg-surface p-0.5">
          <ViewToggle
            active={view === "list"}
            onClick={() => setView("list")}
            icon={List}
            label="List View"
          />
          <ViewToggle
            active={view === "card"}
            onClick={() => setView("card")}
            icon={LayoutGrid}
            label="Card View"
          />
        </div>
      </div>

      {view === "card" ? (
        <ScreeningCardMode pending={pending} scores={scores} onDecide={decide} />
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* ── Left: campaign groups ─────────────────────────── */}
      <aside className="w-[280px] shrink-0 overflow-y-auto border-r border-hairline bg-surface">
        {groups.map(([campaignId, group]) => {
          const isCollapsed = collapsed[campaignId];
          const pending = group.rows.filter((r) => r.status === "pending").length;

          return (
            <div key={campaignId} className="border-b border-hairline">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [campaignId]: !c[campaignId] }))}
                className="flex w-full items-start gap-2 px-3 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                {isCollapsed ? (
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
                ) : (
                  <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">
                    {group.name}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5">
                    <Badge tone="neutral" dot={false}>
                      {group.brand}
                    </Badge>
                    {pending > 0 && (
                      <span className="text-2xs tabular-nums text-ink-faint">{pending} pending</span>
                    )}
                  </span>
                </span>
              </button>

              {!isCollapsed &&
                group.rows.map((row) => {
                  const active = row.id === selectedId;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={cn(
                        "flex w-full items-center gap-2 border-l-2 py-2 pl-3 pr-2.5 text-left transition-colors",
                        active
                          ? "border-l-accent bg-accent-soft"
                          : "border-l-transparent hover:bg-white/[0.03]"
                      )}
                    >
                      <Avatar name={row.influencers?.full_name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[12px]",
                            active ? "text-ink" : "text-ink-muted"
                          )}
                        >
                          {row.influencers?.email ?? row.influencers?.full_name ?? "—"}
                        </span>
                        <span className="mt-0.5 block">
                          <StatusBadge status={row.status} />
                        </span>
                      </span>
                      <ScoreBadge score={scores.get(row.influencer_id) ?? 0} />
                    </button>
                  );
                })}
            </div>
          );
        })}
      </aside>

      {/* ── Right: screening detail ───────────────────────── */}
      {selected ? (
        <CandidatePanel
          candidate={selected}
          stats={stats}
          busyField={busyField}
          onPatch={patch}
          onDecide={decide}
        />
      ) : (
        <div className="flex-1">
          <EmptyState title="Select a candidate" description="Pick someone from the list to screen." />
        </div>
      )}
        </div>
      )}
    </div>
  );
}

function CandidatePanel({
  candidate,
  stats,
  busyField,
  onPatch,
  onDecide,
}: {
  candidate: ScreeningCandidate;
  stats: { approved: number; target: number; shortlisted: number };
  busyField: string | null;
  onPatch: (id: string, fields: Partial<ScreeningCandidate>, fieldKey: string) => Promise<void>;
  onDecide: (candidate: ScreeningCandidate, status: "approved" | "rejected") => Promise<void>;
}) {
  const influencer = candidate.influencers;
  const campaign = candidate.campaigns;
  const [firstName, ...rest] = (influencer?.full_name ?? "").split(" ");
  const lastName = rest.join(" ");

  const deciding = busyField === `decision:${candidate.id}`;

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      {/* Header + primary actions */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-bg/95 px-6 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={influencer?.full_name} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold text-ink">
                {influencer?.full_name ?? "Unknown"}
              </h2>
              <StatusBadge status={candidate.status} />
            </div>
            <p className="truncate text-[13px] text-ink-muted">
              {influencer?.instagram_handle ?? "—"} · {campaign?.name ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="approve"
            size="sm"
            disabled={deciding || candidate.status === "approved"}
            onClick={() => onDecide(candidate, "approved")}
          >
            {deciding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Approve
          </Button>
          <Button
            variant="reject"
            size="sm"
            disabled={deciding || candidate.status === "rejected"}
            onClick={() => onDecide(candidate, "rejected")}
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* 1 — counts */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Approved Influencer" value={stats.approved} success />
          <StatCard label="Target Influencer" value={stats.target} />
          <StatCard label="Shortlisted Influencer" value={stats.shortlisted} />
        </div>

        {/* 2 — application details */}
        <Section title="Application Details">
          <dl className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
            <Detail label="Brand" value={campaign?.brand_name} />
            <Detail label="Month" value={campaign?.month} />
            <Detail label="Target Countries" tags={campaign?.target_countries} />
            <Detail label="Platform" tags={campaign?.platform} />
            <Detail label="Email" value={influencer?.email} />
            <Detail label="First Name" value={firstName || null} />
            <Detail label="Last Name" value={lastName || null} />
            <Detail
              label="IG Handle"
              value={influencer?.instagram_handle}
              href={
                influencer?.instagram_handle
                  ? `https://instagram.com/${influencer.instagram_handle.replace("@", "")}`
                  : null
              }
            />
            <Detail label="IG Followers" value={formatFollowers(influencer?.followers_count)} />
            <Detail
              label="TikTok Handle"
              value={influencer?.tiktok_handle}
              href={
                influencer?.tiktok_handle
                  ? `https://tiktok.com/@${influencer.tiktok_handle.replace("@", "")}`
                  : null
              }
            />
            <Detail
              label="TikTok Followers"
              value={
                influencer?.tiktok_followers ? formatFollowers(influencer.tiktok_followers) : null
              }
            />
            <div>
              <dt className="text-2xs uppercase tracking-wider text-ink-faint">Status</dt>
              <dd className="mt-1.5">
                <StatusBadge status={candidate.status} />
              </dd>
            </div>
          </dl>
        </Section>

        {/* 3 — basic rating */}
        <Section title="Influencer Basic Rating">
          <div className="grid gap-5 sm:grid-cols-2">
            <RatingField label="IG Content Quality" saved={candidate.ig_content_quality}>
              <Select
                value={candidate.ig_content_quality ?? ""}
                onValueChange={(value) =>
                  onPatch(candidate.id, { ig_content_quality: value }, `ig_q:${candidate.id}`)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not rated" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </RatingField>

            <RatingField label="IG Content Style" saved={candidate.ig_content_style}>
              <MultiSelect
                options={CONTENT_STYLES}
                selected={candidate.ig_content_style ?? []}
                onChange={(next) =>
                  onPatch(candidate.id, { ig_content_style: next }, `ig_s:${candidate.id}`)
                }
                placeholder="Select styles"
              />
            </RatingField>

            <RatingField label="TT Content Quality" saved={candidate.tt_content_quality}>
              <Select
                value={candidate.tt_content_quality ?? ""}
                onValueChange={(value) =>
                  onPatch(candidate.id, { tt_content_quality: value }, `tt_q:${candidate.id}`)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not rated" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </RatingField>

            <RatingField label="TT Content Style" saved={candidate.tt_content_style}>
              <MultiSelect
                options={CONTENT_STYLES}
                selected={candidate.tt_content_style ?? []}
                onChange={(next) =>
                  onPatch(candidate.id, { tt_content_style: next }, `tt_s:${candidate.id}`)
                }
                placeholder="Select styles"
              />
            </RatingField>
          </div>
        </Section>

        {/* 4 — campaign rating */}
        <Section title="Campaign Rating">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <CheckToggle
                label="Brand Fit"
                checked={Boolean(candidate.brand_fit)}
                onChange={(value) =>
                  onPatch(candidate.id, { brand_fit: value }, `fit:${candidate.id}`)
                }
              />
              <CheckToggle
                label="Keep An Eye"
                checked={Boolean(candidate.keep_an_eye)}
                onChange={(value) =>
                  onPatch(candidate.id, { keep_an_eye: value }, `eye:${candidate.id}`)
                }
              />
            </div>

            <ScreeningNotes
              key={candidate.id}
              initial={candidate.screening_notes ?? ""}
              onSave={(value) =>
                onPatch(candidate.id, { screening_notes: value }, `notes:${candidate.id}`)
              }
            />
          </div>
        </Section>

        {candidate.last_modified_by && (
          <p className="text-2xs text-ink-faint">
            Last modified by {candidate.last_modified_by}
          </p>
        )}
      </div>
    </div>
  );
}

function ScreeningNotes({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);

  return (
    <div className="space-y-1.5">
      <Label>Notes</Label>
      <Textarea
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value !== initial) onSave(value);
        }}
        placeholder="Screening notes — why this creator fits the campaign, or why not."
      />
      <p className="text-2xs text-ink-faint">Saves when you click away.</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-hairline bg-surface">
      <div className="border-b border-hairline px-5 py-3">
        <h3 className="text-sm font-medium text-ink">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatCard({ label, value, success }: { label: string; value: number; success?: boolean }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface px-4 py-3.5">
      <p className="text-2xs uppercase tracking-wider text-ink-faint">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[26px] font-semibold leading-none tabular-nums",
          success ? "text-success" : "text-ink"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  tags,
  href,
}: {
  label: string;
  value?: string | null;
  tags?: string[] | null;
  href?: string | null;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-1 min-w-0">
        {tags ? (
          tags.length > 0 ? (
            <span className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} tone="neutral" dot={false}>
                  {tag}
                </Badge>
              ))}
            </span>
          ) : (
            <span className="text-[13px] text-ink-faint">Not set</span>
          )
        ) : href && value ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 truncate text-[13px] text-accent hover:underline"
          >
            {value}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <span className="block truncate text-[13px] text-ink" title={value ?? undefined}>
            {value ?? <span className="text-ink-faint">—</span>}
          </span>
        )}
      </dd>
    </div>
  );
}

function RatingField({
  label,
  saved,
  children,
}: {
  label: string;
  saved: string | string[] | null;
  children: React.ReactNode;
}) {
  const savedText = Array.isArray(saved) ? saved.join(", ") : saved;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        <span className="truncate text-2xs text-ink-faint" title={savedText ?? undefined}>
          {savedText ? `Saved: ${savedText}` : "Not set"}
        </span>
      </div>
      {children}
    </div>
  );
}

function CheckToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-3 py-2 text-[13px] transition-colors",
        checked
          ? "border-accent-line bg-accent-soft text-accent"
          : "border-hairline bg-surface-2 text-ink-muted hover:text-ink"
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border transition-colors",
          checked ? "border-accent bg-accent text-black" : "border-white/20"
        )}
      >
        {checked && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
      </span>
      {label}
    </button>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[12px] transition-colors",
        active
          ? "bg-white/[0.07] font-medium text-ink"
          : "text-ink-muted hover:bg-white/[0.03] hover:text-ink"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
