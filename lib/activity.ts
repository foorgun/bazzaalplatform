import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityType = "approved" | "rejected" | "campaign";

export type ActivityItem = {
  id: string;
  type: string;
  message: string;
  influencer_id: string | null;
  campaign_id: string | null;
  read: boolean;
  created_at: string;
};

/**
 * Records an event in the activity feed. Deliberately fire-and-forget: a
 * missing table or a failed insert must never block the action that caused
 * it (approving a candidate, creating a campaign).
 */
export async function logActivity(
  supabase: SupabaseClient,
  entry: {
    type: ActivityType;
    message: string;
    influencer_id?: string | null;
    campaign_id?: string | null;
  }
) {
  try {
    await supabase.from("activity_feed").insert({
      type: entry.type,
      message: entry.message,
      influencer_id: entry.influencer_id ?? null,
      campaign_id: entry.campaign_id ?? null,
    });
  } catch {
    // Feed is non-critical — swallow.
  }
}
