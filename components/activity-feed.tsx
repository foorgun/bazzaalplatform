"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Megaphone, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useRole } from "@/components/role-context";
import { createClient } from "@/lib/supabase/client";
import { cn, timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/lib/activity";

const ICONS: Record<string, React.ElementType> = {
  approved: ThumbsUp,
  rejected: ThumbsDown,
  campaign: Megaphone,
};

const ICON_TONE: Record<string, string> = {
  approved: "border-success-line bg-success-soft text-success",
  rejected: "border-danger/30 bg-danger/10 text-danger",
  campaign: "border-accent-line bg-accent-soft text-accent",
};

/**
 * Bell + slide-in feed. Agency-only: brands and creators have no rows behind
 * RLS, so the control is not rendered for them at all.
 */
export function ActivityFeed() {
  const role = useRole();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = useRef(createClient()).current;

  const enabled = role === "bazzaal";

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    setItems((data ?? []) as ActivityItem[]);
    setLoaded(true);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) return;
    void load();

    const channel = supabase
      .channel("realtime:activity_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_feed" },
        (payload) => {
          const row = payload.new as ActivityItem;
          setItems((current) =>
            current.some((i) => i.id === row.id) ? current : [row, ...current].slice(0, 40)
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, load, supabase]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const unread = items.filter((item) => !item.read).length;

  async function markAllRead() {
    const ids = items.filter((i) => !i.read).map((i) => i.id);
    if (ids.length === 0) return;

    setItems((current) => current.map((i) => ({ ...i, read: true })));
    await supabase.from("activity_feed").update({ read: true }).in("id", ids);
  }

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Activity, ${unread} unread` : "Activity"}
        className="relative flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger ring-2 ring-bg" />
        )}
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden
      />

      {/* Panel */}
      <aside
        aria-label="Live activity"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[320px] flex-col border-l border-hairline bg-surface shadow-2xl shadow-black/50",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3.5">
          <h2 className="text-sm font-medium text-ink">Live Activity</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-2xs uppercase tracking-wider text-ink-faint transition-colors hover:bg-white/[0.04] hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close activity"
              className="rounded-md p-1 text-ink-faint transition-colors hover:bg-white/[0.06] hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!loaded ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-md" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-ink-faint">
              No activity yet. Approvals and new campaigns show up here instantly.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {items.map((item) => {
                const Icon = ICONS[item.type] ?? Megaphone;
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex gap-2.5 px-4 py-3 transition-colors",
                      !item.read && "bg-accent-soft"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                        ICON_TONE[item.type] ?? "border-hairline bg-surface-2 text-ink-muted"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] leading-snug text-ink">
                        {item.message}
                      </span>
                      <span className="mt-0.5 block text-2xs text-ink-faint">
                        {timeAgo(item.created_at)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
