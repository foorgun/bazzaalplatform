import { cn } from "@/lib/utils";

const TONES = {
  default: "text-ink",
  success: "text-success",
  warning: "text-amber-300",
} as const;

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  /** success = a number that means "good"; warning = needs attention. */
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-white/[0.14]">
      <p className="text-2xs uppercase tracking-wider text-ink-faint">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-[26px] font-semibold leading-none tracking-tight tabular-nums",
          TONES[tone]
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-2xs text-ink-faint">{hint}</p>}
    </div>
  );
}
