"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function HomepageReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.32, delay, ease: "easeOut" }
      }
    >
      {children}
    </motion.div>
  );
}
