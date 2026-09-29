import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium tracking-wide",
  {
    variants: {
      tone: {
        neutral: "border-white/10 bg-white/[0.04] text-ink-muted",
        accent: "border-accent-line bg-accent-soft text-accent",
        success: "border-success/25 bg-success/10 text-success",
        danger: "border-danger/25 bg-danger/10 text-danger",
        warning: "border-amber-400/25 bg-amber-400/10 text-amber-300",
        info: "border-sky-400/25 bg-sky-400/10 text-sky-300",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, dot = true, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
