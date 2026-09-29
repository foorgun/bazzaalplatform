import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm text-ink",
        "placeholder:text-ink-faint focus-visible:border-accent-line focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-accent/15 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
