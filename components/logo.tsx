"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Sidebar logo. /public/logo.avif is served as-is (`unoptimized`) because the
 * Next image optimizer has no work to do on an already-compressed avif. The
 * image is filtered to white; the BAZZAAL wordmark fallback matches it.
 */
export function Logo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="select-none text-[15px] font-bold uppercase leading-none tracking-[0.2em] text-white">
        BAZZAAL
      </span>
    );
  }

  return (
    <Image
      src="/logo.avif"
      alt="BAZZAAL"
      width={120}
      height={30}
      priority
      unoptimized
      // brightness-0 flattens the artwork to black, invert flips it to pure
      // white — so the mark renders white whatever colour the source file is.
      className="h-auto w-[120px] object-contain object-left brightness-0 invert"
      onError={() => setFailed(true)}
    />
  );
}
