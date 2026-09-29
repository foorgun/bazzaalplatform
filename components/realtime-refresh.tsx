"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Subscribes to Postgres changes on `table` and re-runs the server render
 * so metrics and tables above stay live without a manual reload.
 */
export function RealtimeRefresh({
  table = "campaign_candidates",
  className,
}: {
  table?: string;
  className?: string;
}) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [pulse, setPulse] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        setPulse(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          router.refresh();
          setPulse(false);
        }, 350);
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router, table]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-2xs uppercase tracking-wider",
        connected ? "text-ink-muted" : "text-ink-faint",
        className
      )}
      title={connected ? `Realtime on ${table}` : "Connecting…"}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors",
          connected ? "bg-success" : "bg-ink-faint",
          (pulse || connected) && "animate-pulse"
        )}
      />
      {connected ? "Live" : "Connecting"}
    </span>
  );
}
