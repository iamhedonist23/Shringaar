"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Check, Heart, ShoppingBag } from "lucide-react";
import type { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ProductCardProps = {
  name: string;
  price: string;
  compareAtPrice?: string;
  image: string;
  hoverImage?: string;
  badge?: string;
  cartTargetRef?: RefObject<HTMLSpanElement | null>;
  onAddToCart?: () => void;
  onQuickView?: () => void;
};

export function ProductCard({
  name,
  price,
  compareAtPrice,
  image,
  hoverImage,
  badge = "Bestseller",
  cartTargetRef,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const [flight, setFlight] = useState<{
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    deltaX: number;
    deltaY: number;
  } | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [burst, setBurst] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const reduceMotion = useReducedMotion();

  function addToCart() {
    setAdded(true);
    const imageBounds = imageRef.current?.getBoundingClientRect();
    const targetBounds = cartTargetRef?.current?.getBoundingClientRect();
    if (!reduceMotion && imageBounds && targetBounds) {
      const id = Date.now();
      setFlight({
        id,
        x: imageBounds.left,
        y: imageBounds.top,
        width: imageBounds.width,
        height: imageBounds.height,
        deltaX:
          targetBounds.left +
          targetBounds.width / 2 -
          (imageBounds.left + imageBounds.width / 2),
        deltaY:
          targetBounds.top +
          targetBounds.height / 2 -
          (imageBounds.top + imageBounds.height / 2),
      });
      window.setTimeout(() => {
        setFlight((current) => (current?.id === id ? null : current));
      }, 320);
    }
    onAddToCart?.();
    window.setTimeout(() => setAdded(false), 1600);
  }

  function toggleWishlist() {
    const next = !wishlisted;
    setWishlisted(next);
    if (next && !reduceMotion) {
      const currentBurst = burst + 1;
      setBurst(currentBurst);
      window.setTimeout(
        () => setBurst((current) => (current === currentBurst ? 0 : current)),
        360,
      );
    }
  }

  return (
    <article className="rounded-card border-border shadow-card hover:shadow-soft dark:bg-ink group overflow-hidden border bg-white transition-shadow">
      <div className="product-image-wrap relative aspect-[4/5] overflow-hidden bg-[#f1e9dc]">
        {!loaded && (
          <div aria-hidden="true" className="skeleton-shimmer absolute inset-0" />
        )}
        <Image
          ref={imageRef}
          alt={name}
          className={`product-image absolute inset-0 h-full w-full object-cover transition duration-300 ${loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"} group-hover:scale-[1.03]`}
          decoding="async"
          fill
          loading="lazy"
          onLoad={() => setLoaded(true)}
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
          src={image}
          unoptimized
        />
        {hoverImage && (
          <Image
            alt=""
            aria-hidden="true"
            className="product-image-secondary absolute inset-0 h-full w-full scale-100 object-cover opacity-0 transition duration-300 group-hover:scale-110 group-hover:opacity-100"
            decoding="async"
            fill
            loading="lazy"
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
            src={hoverImage}
            unoptimized
          />
        )}
        <div className="absolute left-3 top-3">
          <Badge tone="bestseller">{badge}</Badge>
        </div>
        <motion.button
          aria-label={
            wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`
          }
          aria-pressed={wishlisted}
          className={`focus-visible:ring-gold absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 ${wishlisted ? "text-rose" : "text-plum"}`}
          onClick={toggleWishlist}
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.84 }}
        >
          {burst > 0 && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0">
              {[
                [-12, -11],
                [12, -11],
                [-13, 10],
                [13, 10],
                [0, -15],
              ].map(([x, y], index) => (
                <motion.span
                  key={`${burst}-${index}`}
                  animate={{ x, y, opacity: 0, scale: 0.35 }}
                  className="bg-rose absolute left-1/2 top-1/2 size-1.5 rounded-full"
                  initial={{ opacity: 1, scale: 0.5 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                />
              ))}
            </span>
          )}
          <Heart
            aria-hidden="true"
            className="size-5"
            fill={wishlisted ? "currentColor" : "none"}
          />
        </motion.button>
        <button
          className="rounded-control text-plum focus-visible:ring-gold absolute inset-x-3 bottom-3 min-h-10 translate-y-2 bg-white/95 text-xs font-semibold opacity-0 shadow-sm transition duration-200 hover:bg-white focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 group-hover:translate-y-0 group-hover:opacity-100"
          onClick={onQuickView}
          type="button"
        >
          Quick view
        </button>
      </div>
      {flight &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key={flight.id}
              animate={{ x: flight.deltaX, y: flight.deltaY, scale: 0.12, opacity: 0 }}
              className="rounded-control shadow-soft pointer-events-none fixed z-[90] object-cover"
              initial={{ x: 0, y: 0, scale: 1, opacity: 0.92 }}
              style={{
                left: flight.x,
                top: flight.y,
                width: flight.width,
                height: flight.height,
                transformOrigin: "center",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Image
                alt=""
                aria-hidden="true"
                className="rounded-control h-full w-full object-cover"
                fill
                sizes={`${Math.ceil(flight.width)}px`}
                src={image}
                unoptimized
              />
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
      <div className="space-y-2 p-4">
        <h3 className="text-plum line-clamp-1 text-sm font-medium">{name}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-plum font-semibold">{price}</span>
          {compareAtPrice && (
            <span className="text-muted text-xs line-through">{compareAtPrice}</span>
          )}
        </div>
        <Button
          className="w-full"
          onClick={addToCart}
          size="sm"
          variant={added ? "secondary" : "primary"}
        >
          {added ? (
            <>
              <Check aria-hidden="true" className="size-4" /> Added to bag
            </>
          ) : (
            <>
              <ShoppingBag aria-hidden="true" className="size-4" /> Add to bag
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
