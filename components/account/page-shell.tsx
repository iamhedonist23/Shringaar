import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader categories={[]} />
      <main className="min-h-[60vh] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <SiteFooter />
    </>
  );
}

export function AccountPageShell({
  name,
  title,
  children,
}: {
  name: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader categories={[]} />
      <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-contrast">Your Shringaar account</p>
        <h1 className="font-display mt-2 text-4xl text-plum">{title}</h1>
        <p className="mt-2 text-sm text-muted">Hello, {name}</p>
        <nav aria-label="Account navigation" className="mt-6 flex flex-wrap gap-2 border-b border-border pb-4">
          {[
            ["/account", "Overview"],
            ["/account/addresses", "Addresses"],
            ["/account/orders", "Orders"],
          ].map(([href, label]) => (
            <Link className="min-h-10 rounded-full px-4 py-2 text-sm font-medium text-plum hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-7">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
