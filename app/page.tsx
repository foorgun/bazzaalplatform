import { redirect } from "next/navigation";
import { requireProfile, HOME_FOR_ROLE } from "@/lib/auth";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const profile = await requireProfile();
  redirect(HOME_FOR_ROLE[profile.role as Role] ?? "/login");
}
