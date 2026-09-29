/**
 * Influencer score, 0–100, computed on the fly from existing data.
 *
 *   engagement   max 40   ER >= 6% → 40, 4–6% → 30, 2–4% → 20, < 2% → 10
 *   reach        max 30   > 400K → 30, 200–400K → 25, 100–200K → 20, 50–100K → 15, < 50K → 10
 *   content      max 30   Excellent → 30, Good → 22, Average → 14, Poor → 0, unrated → 15
 *
 * The three parts are already expressed in points, so the total is their sum.
 */

export type ScoreBreakdown = {
  score: number;
  engagement: number;
  reach: number;
  content: number;
  rated: boolean;
};

const QUALITY_POINTS: Record<string, number> = {
  Excellent: 30,
  Good: 22,
  Average: 14,
  Poor: 0,
};

const NEUTRAL_QUALITY = 15;

function engagementPoints(rate: number | null | undefined) {
  if (rate === null || rate === undefined) return 10;
  if (rate >= 6) return 40;
  if (rate >= 4) return 30;
  if (rate >= 2) return 20;
  return 10;
}

function reachPoints(followers: number | null | undefined) {
  if (!followers) return 10;
  if (followers > 400_000) return 30;
  if (followers >= 200_000) return 25;
  if (followers >= 100_000) return 20;
  if (followers >= 50_000) return 15;
  return 10;
}

/** Average of every IG content-quality rating this influencer has received. */
function contentPoints(qualities: (string | null | undefined)[]) {
  const rated = qualities.filter(
    (q): q is string => typeof q === "string" && q in QUALITY_POINTS
  );
  if (rated.length === 0) return { points: NEUTRAL_QUALITY, rated: false };

  const total = rated.reduce((sum, q) => sum + QUALITY_POINTS[q], 0);
  return { points: Math.round(total / rated.length), rated: true };
}

export function influencerScore(
  influencer: { engagement_rate?: number | null; followers_count?: number | null },
  qualities: (string | null | undefined)[] = []
): ScoreBreakdown {
  const engagement = engagementPoints(influencer.engagement_rate);
  const reach = reachPoints(influencer.followers_count);
  const content = contentPoints(qualities);

  return {
    score: engagement + reach + content.points,
    engagement,
    reach,
    content: content.points,
    rated: content.rated,
  };
}

export type ScoreTone = "success" | "accent" | "warning" | "danger";

export function scoreTone(score: number): ScoreTone {
  if (score >= 80) return "success";
  if (score >= 60) return "accent";
  if (score >= 40) return "warning";
  return "danger";
}

export const SCORE_BAR_CLASS: Record<ScoreTone, string> = {
  success: "bg-success",
  accent: "bg-accent",
  warning: "bg-amber-400",
  danger: "bg-danger",
};

export const SCORE_TEXT_CLASS: Record<ScoreTone, string> = {
  success: "text-success",
  accent: "text-accent",
  warning: "text-amber-300",
  danger: "text-danger",
};
