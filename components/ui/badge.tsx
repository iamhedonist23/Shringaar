"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "new" | "bestseller" | "low-stock" | "success";

const tones: Record<BadgeTone, string> = {
  new: "border-gold/20 bg-gold/10 text-plum",
  bestseller: "border-rose/30 bg-rose/20 text-plum",
  "low-stock": "border-error/20 bg-error/5 text-error",
  success: "border-success/20 bg-success/10 text-success",
};

export function Badge({
  tone = "new",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { amount: 0.1 });
  const reduceMotion = useReducedMotion();

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tones[tone],
        tone === "new" && "shimmer-badge",
        className,
      )}
      style={
        tone === "new"
          ? { animationPlayState: isInView && !reduceMotion ? "running" : "paused" }
          : undefined
      }
      {...props}
    >
      {tone === "new" && <Sparkles aria-hidden="true" className="size-3" />}
      {children}
    </span>
  );
}
