"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * App-wide toast host, themed to match the dark UI. Per-type classes carry
 * `!` so they beat the inline base style sonner applies to every toast.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#F2F2F0",
          fontSize: "13px",
        },
        classNames: {
          description: "text-ink-muted",
          success:
            "!border-success/30 [&_[data-icon]]:!text-success [&_[data-title]]:!text-success",
          error: "!border-danger/30 [&_[data-icon]]:!text-danger [&_[data-title]]:!text-danger",
          warning:
            "!border-amber-400/30 [&_[data-icon]]:!text-amber-300 [&_[data-title]]:!text-amber-300",
        },
      }}
    />
  );
}
