"use client";

import { useState } from "react";
import { cn, getAvatarPath, initials } from "@/lib/utils";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-[13px]",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
};

/**
 * Influencer photo from /public/avatar/, falling back to initials in the accent
 * colour when the file is missing or fails to load. Pass `photo={false}` for
 * people who are not influencers (app users), where no file is expected.
 */
export function Avatar({
  name,
  size = "md",
  photo = true,
  className,
}: {
  name: string | null | undefined;
  size?: keyof typeof SIZES;
  photo?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = photo && Boolean(name) && !failed;

  if (showPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getAvatarPath(name!)}
        alt={name!}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(
          "shrink-0 rounded-full border border-hairline bg-surface-2 object-cover",
          SIZES[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-accent-line bg-accent-soft font-medium text-accent",
        SIZES[size],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
