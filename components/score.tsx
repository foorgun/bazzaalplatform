import { cn } from "@/lib/utils";
import { SCORE_BAR_CLASS, SCORE_TEXT_CLASS, scoreTone } from "@/lib/scoring";

/** Number plus a proportional bar — used in the influencers table. */
export function ScoreCell({ score }: { score: number }) {
  const tone = scoreTone(score);
  return (
    <div className="w-[64px]">
      <p className={cn("text-[13px] font-medium tabular-nums", SCORE_TEXT_CLASS[tone])}>{score}</p>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={cn("h-full rounded-full transition-all", SCORE_BAR_CLASS[tone])}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}

/** Compact pill — used on screening cards and in the candidate list. */
export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const tone = scoreTone(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-2xs font-medium tabular-nums",
        tone === "success" && "border-success-line bg-success-soft text-success",
        tone === "accent" && "border-accent-line bg-accent-soft text-accent",
        tone === "warning" && "border-amber-400/30 bg-amber-400/10 text-amber-300",
        tone === "danger" && "border-danger/30 bg-danger/10 text-danger",
        className
      )}
      title={`Influencer score ${score}/100`}
    >
      {score}
    </span>
  );
}
