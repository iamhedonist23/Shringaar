"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";

type ProductGalleryProps = {
  productName: string;
  imageUrls: string[];
};

export function ProductGallery({ productName, imageUrls }: ProductGalleryProps) {
  const images = imageUrls.length > 0 ? imageUrls : [null];
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);

  function showImage(index: number) {
    setActiveIndex((index + images.length) % images.length);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showImage(activeIndex + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showImage(activeIndex - 1);
    }
  }

  return (
    <section aria-label={`${productName} product images`} className="min-w-0">
      <div
        aria-label={`Image ${activeIndex + 1} of ${images.length}`}
        className="group relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#f1e9dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return;
          const delta = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (Math.abs(delta) > 48) showImage(activeIndex + (delta < 0 ? 1 : -1));
        }}
        role="group"
        tabIndex={images.length > 1 ? 0 : undefined}
      >
        <ImageWithFallback
          alt={`${productName}, view ${activeIndex + 1}`}
          className="object-cover"
          loading="eager"
          sizes="(max-width: 1023px) 100vw, 50vw"
          src={images[activeIndex]}
        />
        {images.length > 1 && (
          <>
            <button
              aria-label="Previous product image"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              onClick={() => showImage(activeIndex - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              aria-label="Next product image"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              onClick={() => showImage(activeIndex + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-plum/80 px-3 py-1 text-xs text-white">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div
          aria-label="Choose product image"
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          role="group"
        >
          {images.map((image, index) => (
            <button
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              className={`relative size-16 shrink-0 overflow-hidden rounded-control border-2 bg-[#f1e9dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                index === activeIndex ? "border-gold" : "border-transparent"
              }`}
              key={`${image ?? "empty"}-${index}`}
              onClick={() => showImage(index)}
              type="button"
            >
              <ImageWithFallback
                alt=""
                className="object-cover"
                sizes="64px"
                src={image}
              />
            </button>
          ))}
        </div>
      )}
      {images.length > 1 && (
        <p className="sr-only" aria-live="polite">
          Showing image {activeIndex + 1} of {images.length}
        </p>
      )}
    </section>
  );
}
