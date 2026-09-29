import type { Role } from "@/lib/types";

/** Landing page per role — shared by the login form, middleware and guards. */
export const HOME_FOR_ROLE: Record<Role, string> = {
  bazzaal: "/dashboard",
  creator: "/my-applications",
  brand: "/brand-dashboard",
};
