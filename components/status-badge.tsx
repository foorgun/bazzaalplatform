import { Badge, type BadgeTone } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

const TONES: Record<string, BadgeTone> = {
  // campaigns
  draft: "neutral",
  active: "success",
  completed: "success",
  // candidates
  pending: "warning",
  approved: "success",
  rejected: "danger",
  // shipments
  preparing: "neutral",
  shipped: "info",
  delivered: "success",
  // influencers
  inactive: "neutral",
};

/** post_status reuses the word "pending", but reads gray rather than amber. */
const POST_TONES: Record<string, BadgeTone> = {
  pending: "neutral",
  posted: "success",
};

export function StatusBadge({
  status,
  kind = "default",
}: {
  status: string | null | undefined;
  kind?: "default" | "post";
}) {
  if (!status) return <span className="text-ink-faint">—</span>;
  const tones = kind === "post" ? POST_TONES : TONES;
  return <Badge tone={tones[status] ?? "neutral"}>{titleCase(status)}</Badge>;
}
