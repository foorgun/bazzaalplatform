import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full resize-y rounded-md border border-hairline bg-surface-2 px-3 py-2.5 text-sm leading-relaxed text-ink",
      "placeholder:text-ink-faint focus-visible:border-accent-line focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-accent/15 disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
