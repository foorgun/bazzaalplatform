"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-2xs uppercase tracking-[0.2em] text-danger">Something broke</p>
      <p className="max-w-md text-sm font-medium text-ink">{error.message}</p>
      <p className="max-w-md text-[13px] text-ink-muted">
        Check that your Supabase URL and anon key are set in .env.local and that the SQL files have
        been run.
      </p>
      <Button variant="outline" size="sm" className="mt-1" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
