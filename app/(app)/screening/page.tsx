import { PageHeader } from "@/components/page-header";
import { ScreeningWorkspace } from "@/components/screening-workspace";
import { ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ScreeningCandidate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ScreeningPage() {
  const profile = await requireRole("bazzaal");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("campaign_candidates")
    .select(
      "*, influencers(*), campaigns(id, name, brand_name, status, client_name, month, platform, target_countries, target_influencer_count)"
    )
    .order("applied_at", { ascending: true });

  if (error) {
    return (
      <>
        <PageHeader title="Screening" description="Review applications campaign by campaign." />
        <div className="p-8">
          <ErrorState message={error.message} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Screening" description="Review applications campaign by campaign." />
      <ScreeningWorkspace
        initialCandidates={(data ?? []) as ScreeningCandidate[]}
        userEmail={profile.email}
      />
    </>
  );
}
