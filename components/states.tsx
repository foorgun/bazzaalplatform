import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title = "Nothing here yet",
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-16 text-center", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface-2">
        <Inbox className="h-4 w-4 text-ink-faint" />
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-ink-muted">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger/25 bg-danger/[0.06] px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
      <div>
        <p className="text-sm font-medium text-danger">Could not load data</p>
        <p className="mt-0.5 text-[13px] text-ink-muted">{message}</p>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-hairline">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 px-4 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-3.5" style={{ width: `${55 + ((r + c) % 4) * 10}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-[88px] rounded-lg", className)} />;
}
