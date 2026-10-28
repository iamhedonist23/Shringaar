import Link from "next/link";
import type { ReactNode } from "react";

export function StorefrontSection({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-contrast">
            {eyebrow}
          </p>
          <h2 className="font-display mt-2 text-3xl tracking-tight text-plum sm:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {description}
            </p>
          )}
        </div>
        {href && (
          <Link
            className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold text-plum hover:bg-plum/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:text-sm"
            href={href}
          >
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
