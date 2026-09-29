import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";
import { HOME_FOR_ROLE } from "@/lib/roles";

export { HOME_FOR_ROLE };

/** Current signed-in profile, or redirect to /login. */
export async function requireProfile(): Promise<Profile> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login?error=not-configured");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Authenticated but no profile row yet — treat as unconfigured account.
    redirect("/login?error=no-profile");
  }

  return profile as Profile;
}

/** Profile guarded by role — anyone else is bounced to their own home. */
export async function requireRole(...roles: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!profile.role || !roles.includes(profile.role)) {
    redirect(HOME_FOR_ROLE[profile.role as Role] ?? "/login");
  }
  return profile;
}
