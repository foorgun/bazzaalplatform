import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/toaster";
import { RoleProvider } from "@/components/role-context";
import { requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <RoleProvider role={profile.role}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar profile={profile} />
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">{children}</div>
        </main>
        <Toaster />
      </div>
    </RoleProvider>
  );
}
