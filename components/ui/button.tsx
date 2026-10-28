import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-control px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-100",
  {
    variants: {
      variant: {
        primary: "bg-gold text-ink shadow-sm hover:bg-plum hover:text-white",
        secondary: "border border-plum/20 bg-transparent text-plum hover:bg-plum/5",
        ghost: "text-plum hover:bg-plum/5",
      },
      size: {
        default: "h-11",
        sm: "h-9 min-h-9 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11 min-h-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  motionEffect?: boolean;
}

export function Button({
  className,
  variant,
  size,
  motionEffect = true,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        motionEffect && "active:scale-[0.98]",
        className,
      )}
      {...props}
    />
  );
}
