"use client";

import Image from "next/image";
import { useState } from "react";

/** A remote photo that removes itself if it can't load, revealing the artwork behind it. */
export function Photo({ src, alt, sizes, className = "" }: { src: string; alt: string; sizes: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      // Catches images that failed before this component became interactive.
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
      }}
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      onError={() => setFailed(true)}
      className={`object-cover object-[50%_25%] ${className}`}
    />
  );
}
