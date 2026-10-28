import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select
        className={cn(
          "rounded-control border-border text-ink focus-visible:border-gold focus-visible:ring-gold/20 dark:bg-ink h-11 w-full appearance-none border bg-white px-3.5 pr-10 text-sm outline-none focus-visible:ring-2",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-muted pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
      />
    </span>
  );
}
