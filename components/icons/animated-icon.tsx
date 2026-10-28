"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type AnimatedIconProps = {
  icon: LucideIcon;
  label: string;
  className?: string;
  animate?: boolean;
};

export function AnimatedIcon({
  icon: Icon,
  label,
  className,
  animate = true,
}: AnimatedIconProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      aria-label={label}
      role="img"
      className={className}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={animate && !reduceMotion ? { y: -2 } : undefined}
      transition={{ duration: 0.18 }}
    >
      <Icon aria-hidden="true" />
    </motion.span>
  );
}
