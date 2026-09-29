"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Package,
  Settings,
  Sparkles,
  UserSearch,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";
import type { Profile, Role } from "@/lib/types";

type NavItem = { href: string; label: string; icon: React.ElementType };

const NAV: Record<Role, NavItem[]> = {
  bazzaal: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/candidates", label: "Campaign Candidates", icon: UserSearch },
    { href: "/influencers", label: "Influencers", icon: Users },
    { href: "/insights", label: "Insights", icon: BarChart3 },
    { href: "/screening", label: "Screening", icon: ClipboardCheck },
    { href: "/shipment", label: "Shipment", icon: Package },
    { href: "/final-list", label: "Final List", icon: ListChecks },
  ],
  brand: [
    { href: "/brand-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/brand-shipments", label: "Shipments", icon: Package },
  ],
  creator: [{ href: "/my-applications", label: "My Applications", icon: Sparkles }],
};

const ROLE_LABEL: Record<Role, string> = {
  bazzaal: "Agency",
  brand: "Brand",
  creator: "Creator",
};

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const items = NAV[(profile.role ?? "creator") as Role] ?? [];

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-hairline bg-surface">
      <div className="flex h-[57px] items-center border-b border-hairline px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                active
                  ? "bg-white/[0.06] font-medium text-ink"
                  : "text-ink-muted hover:bg-white/[0.03] hover:text-ink"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-accent" : "text-ink-faint group-hover:text-ink-muted"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-hairline p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
            pathname === "/settings"
              ? "bg-white/[0.06] font-medium text-ink"
              : "text-ink-muted hover:bg-white/[0.03] hover:text-ink"
          )}
        >
          <Settings className="h-4 w-4 shrink-0 text-ink-faint" />
          Settings
        </Link>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-ink-muted transition-colors hover:bg-white/[0.03] hover:text-ink"
          >
            <LogOut className="h-4 w-4 shrink-0 text-ink-faint" />
            Logout
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2.5 border-t border-hairline px-4 py-3">
        <Avatar name={profile.full_name ?? profile.email} size="sm" photo={false} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">
            {profile.full_name ?? profile.email}
          </p>
          <p className="truncate text-2xs text-ink-faint">
            {ROLE_LABEL[(profile.role ?? "creator") as Role]}
            {profile.brand_name ? ` · ${profile.brand_name}` : ""}
          </p>
        </div>
      </div>
    </aside>
  );
}
