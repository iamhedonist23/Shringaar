import type { ReactNode } from "react";
import type { listCategories } from "@/lib/catalog";
import type { StoreProduct } from "@/components/storefront/product-tile";
import type { CatalogDiscoveryQuery } from "@/lib/catalog-schemas";
import type { CatalogDiscoveryResult, CatalogFacets } from "@/lib/catalog";
import { DiscoveryListing } from "@/components/storefront/discovery-controls";
import { StorefrontShell } from "@/components/storefront/storefront-shell";

type HeaderCategory = Awaited<ReturnType<typeof listCategories>>[number];

export function CatalogPage({
  categories,
  title,
  eyebrow,
  description,
  products,
  result,
  facets,
  query,
  action,
  error,
  children,
}: {
  categories: HeaderCategory[];
  title: string;
  eyebrow: string;
  description?: string | null;
  products: StoreProduct[];
  result: CatalogDiscoveryResult | null;
  facets: CatalogFacets;
  query: CatalogDiscoveryQuery;
  action: string;
  error?: boolean;
  children?: ReactNode;
}) {
  return (
    <StorefrontShell categories={categories}>
      <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-8 max-w-3xl sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-contrast">
            {eyebrow}
          </p>
          <h1 className="font-display mt-2 text-4xl tracking-tight text-plum sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
              {description}
            </p>
          )}
          {children}
        </header>
        {error && (
          <div
            className="mb-6 rounded-card border border-error/20 bg-white px-5 py-4 text-sm text-plum"
            role="status"
          >
            We couldn’t load these pieces right now. Please try again shortly.
          </div>
        )}
        <DiscoveryListing
          action={action}
          facets={facets}
          query={query}
          result={result}
          products={products}
          unavailable={error}
          emptyDescription={
            error
              ? "The product collection is temporarily unavailable."
              : "There are no pieces here just yet. Explore another Shringaar edit."
          }
          emptyTitle={error ? "Collection unavailable" : "No pieces found"}
        />
      </div>
    </StorefrontShell>
  );
}
