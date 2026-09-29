import { PageHeader } from "@/components/page-header";
import { BrandShipmentsTable } from "@/components/brand-shipments-table";
import { ErrorState } from "@/components/states";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ShipmentWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrandShipmentsPage() {
  const profile = await requireRole("brand");
  const supabase = createClient();

  // RLS restricts this to shipments on the signed-in brand's own campaigns.
  const { data, error } = await supabase
    .from("shipments")
    .select("*, influencers(id, full_name, instagram_handle), campaigns(id, name, brand_name)")
    .order("updated_at", { ascending: false });

  const shipments = (data ?? []) as ShipmentWithRelations[];

  return (
    <>
      <PageHeader
        title="Shipments"
        description={`Product seeding for ${profile.brand_name ?? "your"} campaigns.`}
      />

      <div className="space-y-4 p-8">
        {error && <ErrorState message={error.message} />}
        <BrandShipmentsTable shipments={shipments} />
      </div>
    </>
  );
}
