"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MultiSelectOption = { value: string; label: string };

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select…",
  searchPlaceholder,
  searchable = false,
  className,
}: {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const visible = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  }

  const summary =
    selected.length === 0
      ? placeholder
      : options
          .filter((option) => selected.includes(option.value))
          .map((option) => option.label)
          .join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-hairline bg-surface-2 px-3 text-sm",
          "focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-accent/15",
          selected.length === 0 ? "text-ink-faint" : "text-ink",
          className
        )}
      >
        <span className="truncate text-left">{summary}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {selected.length > 0 && (
            <span className="rounded-full bg-accent-soft px-1.5 text-2xs tabular-nums text-accent">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-ink-faint" />
        </span>
      </PopoverTrigger>

      <PopoverContent className="max-h-64 overflow-y-auto">
        {searchable && (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder ?? "Search…"}
            className="mb-1 w-full rounded-sm border-b border-hairline bg-transparent px-2.5 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        )}

        {visible.length === 0 ? (
          <p className="px-2.5 py-3 text-[13px] text-ink-faint">No matches</p>
        ) : (
          visible.map((option) => {
            const active = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left text-[13px] transition-colors",
                  active ? "text-ink" : "text-ink-muted",
                  "hover:bg-white/[0.06] hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                    active ? "border-accent bg-accent text-black" : "border-white/20"
                  )}
                >
                  {active && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                </span>
                {option.label}
              </button>
            );
          })
        )}
      </PopoverContent>
    </Popover>
  );
}
