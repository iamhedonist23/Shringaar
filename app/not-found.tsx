import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/storefront-shell";

export default function NotFound() {
  return (
    <StorefrontShell categories={[]}>
      <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-contrast">
          A little detour
        </p>
        <h1 className="font-display mt-3 text-4xl text-plum sm:text-5xl">
          This page isn’t here
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          The page may have moved, or the link may be out of date. Let’s find something lovely instead.
        </p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-control bg-plum px-5 text-sm font-semibold text-white hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          href="/"
        >
          Return to Shringaar
        </Link>
      </main>
    </StorefrontShell>
  );
}
