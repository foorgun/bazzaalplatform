import { PageHeader } from "@/components/page-header";
import { CampaignsTable } from "@/components/campaigns-table";
import { CreateCampaignDialog } from "@/components/create-campaign-dialog";
import { ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Campaign } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  await requireRole("bazzaal");
  const supabase = createClient();

  const [campaignsResult, candidatesResult] = await Promise.all([
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
    supabase.from("campaign_candidates").select("campaign_id"),
  ]);

  const campaigns = (campaignsResult.data ?? []) as Campaign[];

  const candidateCounts: Record<string, number> = {};
  for (const row of (candidatesResult.data ?? []) as { campaign_id: string }[]) {
    candidateCounts[row.campaign_id] = (candidateCounts[row.campaign_id] ?? 0) + 1;
  }

  return (
    <>
      <PageHeader title="Campaigns" description="Every campaign across all brands." />

      <div className="space-y-4 p-8">
        {campaignsResult.error && <ErrorState message={campaignsResult.error.message} />}
        <CampaignsTable
          campaigns={campaigns}
          candidateCounts={candidateCounts}
          action={<CreateCampaignDialog />}
        />
      </div>
    </>
  );
}
