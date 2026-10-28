import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Chip({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "border-plum/10 text-plum inline-flex items-center rounded-full border bg-white px-3 py-1.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}
