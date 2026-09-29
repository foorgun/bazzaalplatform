import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

const STEPS: { key: keyof Campaign; label: string }[] = [
  { key: "guidelines_sent_at", label: "Guidelines Sent" },
  { key: "shared_with_client_at", label: "Shared with Client" },
  { key: "shipment_created_at", label: "Shipment Created" },
  { key: "content_posted_at", label: "Content Posted" },
  { key: "completed_at", label: "Completed" },
];

export function ProgressTracker({ campaign }: { campaign: Campaign }) {
  const steps = STEPS.map((step) => ({
    ...step,
    date: (campaign[step.key] as string | null) ?? null,
  }));

  return (
    <div className="overflow-x-auto px-6 py-7">
      <div className="flex min-w-[720px] items-start">
        {steps.map((step, index) => {
          const done = Boolean(step.date);
          const previousDone = index > 0 && Boolean(steps[index - 1].date);

          return (
            <Fragment key={step.key as string}>
              {index > 0 && (
                <div
                  className={cn(
                    "mt-[13px] h-px flex-1 transition-colors",
                    previousDone && done ? "bg-success" : "bg-white/10"
                  )}
                />
              )}
              <div className="flex w-[132px] shrink-0 flex-col items-center px-1 text-center">
                <div
                  className={cn(
                    "flex h-[27px] w-[27px] items-center justify-center rounded-full border transition-colors",
                    done
                      ? "border-success bg-success text-black"
                      : "border-white/15 bg-surface-2 text-transparent"
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  )}
                </div>
                <p
                  className={cn(
                    "mt-2.5 text-[13px] leading-tight",
                    done ? "font-medium text-ink" : "text-ink-muted"
                  )}
                >
                  {step.label}
                </p>
                <p className={cn("mt-1 text-2xs", done ? "text-success" : "text-ink-faint")}>
                  {done ? formatDate(step.date) : "Not yet"}
                </p>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
