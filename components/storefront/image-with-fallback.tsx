"use client";

import { useState } from "react";
import Image from "next/image";
import { Gem } from "lucide-react";

type ImageWithFallbackProps = {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
};

export function ImageWithFallback({
  src,
  alt,
  className = "",
  sizes = "100vw",
  loading = "lazy",
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-label={alt ? `${alt} image unavailable` : "Product image unavailable"}
        className={`grid place-items-center bg-gradient-to-br from-[#f1e5d5] via-[#f8f0e5] to-[#e8d8c4] text-gold ${className}`}
        role="img"
      >
        <Gem aria-hidden="true" className="size-10 opacity-60" />
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      decoding="async"
      fill
      onError={() => setFailed(true)}
      loading={loading}
      sizes={sizes}
      src={src}
      unoptimized={src.startsWith("http://") || src.startsWith("https://")}
    />
  );
}
