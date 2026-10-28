"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.1 });
  const reduceMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-control", className)}
      style={{ animationPlayState: isInView && !reduceMotion ? "running" : "paused" }}
      {...props}
    />
  );
}
