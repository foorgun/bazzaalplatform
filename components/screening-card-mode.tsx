"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { ArrowRight, Check, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ScoreBadge } from "@/components/score";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatFollowers } from "@/lib/utils";
import type { ScreeningCandidate } from "@/lib/types";

type Decision = "approved" | "rejected";

/** Drag distance that commits a decision, in px. */
const SWIPE_THRESHOLD = 100;
const MAX_ROTATION = 15;
const EXIT_DISTANCE = 640;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * One card at a time, keyboard driven. The queue is captured once on mount so
 * a decision does not reshuffle the deck under the reviewer.
 */
export function ScreeningCardMode({
  pending,
  scores,
  onDecide,
}: {
  pending: ScreeningCandidate[];
  scores: Map<string, number>;
  onDecide: (candidate: ScreeningCandidate, decision: Decision) => Promise<void>;
}) {
  const [queue] = useState(pending);
  const [index, setIndex] = useState(0);
  const [decided, setDecided] = useState<Set<string>>(new Set());
  const [exit, setExit] = useState<Decision | null>(null);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);

  const current = index < queue.length ? queue[index] : null;
  const remaining = queue.length - decided.size;

  /** Next card that still needs a decision, wrapping past skipped ones. */
  const advance = useCallback(
    (handled: Set<string>) => {
      for (let step = 1; step <= queue.length; step++) {
        const next = (index + step) % queue.length;
        if (!handled.has(queue[next].id)) {
          setIndex(next);
          return;
        }
      }
      setIndex(queue.length); // everything reviewed
    },
    [index, queue]
  );

  const decide = useCallback(
    (decision: Decision) => {
      if (!current || exit) return;

      setExit(decision);
      void onDecide(current, decision);

      const handled = new Set(decided).add(current.id);
      setDecided(handled);

      window.setTimeout(() => {
        setExit(null);
        setDrag(0);
        setDragging(false);
        advance(handled);
      }, 150);
    },
    [current, exit, onDecide, decided, advance]
  );

  const skip = useCallback(() => {
    if (!current || exit) return;
    setDrag(0);
    advance(decided);
  }, [current, exit, advance, decided]);

  // Pointer + touch drag. Past the threshold the release commits the decision,
  // otherwise the card springs back to centre.
  const bindDrag = useDrag(
    ({ down, movement: [mx], last }) => {
      if (exit) return;

      if (down) {
        setDragging(true);
        setDrag(mx);
        return;
      }

      if (last) {
        setDragging(false);
        if (Math.abs(mx) > SWIPE_THRESHOLD) {
          decide(mx > 0 ? "approved" : "rejected");
        } else {
          setDrag(0);
        }
      }
    },
    { axis: "x", filterTaps: true, pointer: { touch: true } }
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        decide("approved");
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        decide("rejected");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        skip();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, skip]);

  const ratings = useMemo(() => {
    if (!current) return [] as { label: string; value: string }[];
    return [
      { label: "IG", value: current.ig_content_quality ?? "" },
      { label: "TT", value: current.tt_content_quality ?? "" },
    ].filter((r) => r.value);
  }, [current]);

  if (queue.length === 0 || !current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-success-line bg-success-soft">
          <Check className="h-5 w-5 text-success" strokeWidth={3} />
        </div>
        <p className="text-sm font-medium text-ink">All candidates reviewed</p>
        <p className="text-[13px] text-ink-muted">
          Nothing left in the screening queue. Switch to List View to revisit decisions.
        </p>
      </div>
    );
  }

  const influencer = current.influencers;
  const score = scores.get(current.influencer_id) ?? 0;

  const offset = exit ? (exit === "approved" ? EXIT_DISTANCE : -EXIT_DISTANCE) : drag;
  const rotation = clamp(offset / 20, -MAX_ROTATION, MAX_ROTATION);
  const approveTint = exit === "approved" ? 1 : clamp(drag / SWIPE_THRESHOLD, 0, 1);
  const rejectTint = exit === "rejected" ? 1 : clamp(-drag / SWIPE_THRESHOLD, 0, 1);

  const cardStyle: React.CSSProperties = {
    transform: `translateX(${offset}px) rotate(${rotation}deg)`,
    opacity: exit ? 0 : 1,
    // No transition while the finger is down; spring back on release.
    transition: dragging
      ? "none"
      : exit
        ? "transform 150ms ease-out, opacity 150ms ease-out"
        : "transform 280ms cubic-bezier(0.18, 0.89, 0.32, 1.28)",
    touchAction: "none",
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-8">
      <p className="mb-4 text-2xs uppercase tracking-wider text-ink-faint">
        {index + 1} of {queue.length} pending
        {remaining !== queue.length && ` · ${remaining} left`}
      </p>

      <div
        {...bindDrag()}
        style={cardStyle}
        className={cn(
          "relative w-full max-w-[480px] cursor-grab select-none rounded-lg border bg-surface p-7 active:cursor-grabbing",
          approveTint > 0.05
            ? "border-success-line"
            : rejectTint > 0.05
              ? "border-danger/40"
              : "border-hairline"
        )}
      >
        {/* Swipe tints — opacity tracks how far the card has travelled. */}
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-success/[0.14]"
          style={{ opacity: approveTint }}
          aria-hidden
        >
          <Check className="h-20 w-20 text-success" strokeWidth={2.5} />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-danger/[0.14]"
          style={{ opacity: rejectTint }}
          aria-hidden
        >
          <X className="h-20 w-20 text-danger" strokeWidth={2.5} />
        </div>

        <span className="absolute right-4 top-4">
          <ScoreBadge score={score} />
        </span>

        <div className="flex flex-col items-center text-center">
          <Avatar name={influencer?.full_name} size="xl" />
          <h2 className="mt-3.5 text-lg font-semibold tracking-tight text-ink">
            {influencer?.full_name ?? "Unknown"}
          </h2>
          <p className="text-[13px] text-ink-muted">{influencer?.instagram_handle ?? "—"}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline">
          <div className="bg-surface-2 px-3 py-2.5 text-center">
            <p className="text-2xs uppercase tracking-wider text-ink-faint">Followers</p>
            <p className="mt-0.5 text-[15px] font-medium tabular-nums text-ink">
              {formatFollowers(influencer?.followers_count)}
            </p>
          </div>
          <div className="bg-surface-2 px-3 py-2.5 text-center">
            <p className="text-2xs uppercase tracking-wider text-ink-faint">Engagement</p>
            <p
              className={cn(
                "mt-0.5 text-[15px] font-medium tabular-nums",
                (influencer?.engagement_rate ?? 0) >= 5 ? "text-success" : "text-ink"
              )}
            >
              {influencer?.engagement_rate?.toFixed(1) ?? "—"}%
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-2xs uppercase tracking-wider text-ink-faint">Applied to</p>
          <p className="mt-1 text-[13px] text-ink">{current.campaigns?.name ?? "—"}</p>
        </div>

        {ratings.length > 0 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {ratings.map((rating) => (
              <Badge key={rating.label} tone="neutral" dot={false}>
                {rating.label} · {rating.value}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="reject" size="lg" onClick={() => decide("rejected")} disabled={Boolean(exit)}>
            <X className="h-4 w-4" />
            Reject
          </Button>
          <Button variant="approve" size="lg" onClick={() => decide("approved")} disabled={Boolean(exit)}>
            <Check className="h-4 w-4" />
            Approve
          </Button>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-2xs text-ink-faint">
        Swipe the card · <Kbd>A</Kbd> to approve · <Kbd>R</Kbd> to reject ·{" "}
        <Kbd>
          <ArrowRight className="h-2.5 w-2.5" />
        </Kbd>{" "}
        to skip
      </p>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-hairline bg-surface-2 px-1 font-sans text-[10px] text-ink-muted">
      {children}
    </kbd>
  );
}
