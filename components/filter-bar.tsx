import Link from "next/link";
import { cn } from "@/lib/utils";

export function FilterBar({
  basePath,
  param = "status",
  current,
  options,
}: {
  basePath: string;
  param?: string;
  current?: string;
  options: { value: string; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-hairline bg-surface p-1">
      {options.map((option) => {
        const active = (current ?? "all") === option.value;
        const href = option.value === "all" ? basePath : `${basePath}?${param}=${option.value}`;
        return (
          <Link
            key={option.value}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] transition-colors",
              active
                ? "bg-white/[0.07] font-medium text-ink"
                : "text-ink-muted hover:bg-white/[0.03] hover:text-ink"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1.5 tabular-nums text-ink-faint">{option.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
