import type { ReactNode } from "react";
import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";

type HeaderCategory = { name: string; slug: string };

export function StorefrontShell({
  categories,
  children,
}: {
  categories: HeaderCategory[];
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader categories={categories} />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
