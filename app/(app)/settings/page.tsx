import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLE_COPY: Record<string, string> = {
  bazzaal: "Full access to every campaign, creator and shipment.",
  brand: "Access limited to your own campaigns and their approved creators.",
  creator: "Access limited to your own applications and shipments.",
};

export default async function SettingsPage() {
  const profile = await requireProfile();

  const rows = [
    { label: "Full name", value: profile.full_name ?? "—" },
    { label: "Email", value: profile.email ?? "—" },
    { label: "Brand", value: profile.brand_name ?? "—" },
    { label: "Member since", value: formatDate(profile.created_at) },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Your account and workspace access." />

      <div className="max-w-2xl space-y-4 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <Badge tone="accent">{profile.role ?? "unknown"}</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={profile.full_name ?? profile.email} size="lg" photo={false} />
              <div>
                <p className="text-sm font-medium text-ink">{profile.full_name ?? "—"}</p>
                <p className="text-[13px] text-ink-muted">{profile.email}</p>
              </div>
            </div>

            <dl className="divide-y divide-hairline border-t border-hairline">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <dt className="text-[13px] text-ink-muted">{row.label}</dt>
                  <dd className="text-[13px] text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="rounded-md border border-hairline bg-surface-2 px-3 py-2.5 text-[13px] text-ink-muted">
              {ROLE_COPY[profile.role ?? ""] ?? "No role assigned."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-[13px] text-ink-muted">
              Sign out of the BAZZAAL Platform on this device.
            </p>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Logout
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
