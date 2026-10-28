import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "rounded-control border-border text-ink placeholder:text-muted focus-visible:border-gold focus-visible:ring-gold/20 dark:bg-ink flex h-11 w-full border bg-white px-3.5 text-sm outline-none transition focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
