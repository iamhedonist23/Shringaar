import type { Metadata } from "next";
import Link from "next/link";
import { DiscoveryListing } from "@/components/storefront/discovery-controls";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import {
  discoverCatalogProducts,
  getCatalogFacets,
  listCategories,
  type CatalogFacets,
} from "@/lib/catalog";
import { catalogDiscoveryQuerySchema } from "@/lib/catalog-schemas";

export const metadata: Metadata = {
  title: "Search jewellery | Shringaar",
  description: "Search and filter imitation jewellery from the Shringaar collection.",
};
export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const criteriaParams = [
  "category",
  "parentCategory",
  "minPrice",
  "maxPrice",
  "occasion",
  "material",
  "finish",
  "stoneType",
  "color",
  "inStock",
  "sort",
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const parsed = catalogDiscoveryQuerySchema.safeParse(params);
  const query = parsed.success
    ? parsed.data
    : catalogDiscoveryQuerySchema.parse({});
  const hasCriteria =
    parsed.success &&
    (Boolean(query.q) || criteriaParams.some((key) => key in params));

  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let facets: CatalogFacets = {
    categories: [],
    occasions: ["Bridal", "Festive", "Daily Wear", "Office Wear"],
    materials: [],
    finishes: [],
    stoneTypes: [],
    colors: [],
  };
  let result: Awaited<ReturnType<typeof discoverCatalogProducts>> | null = null;
  let unavailable = false;

  try {
    [categories, facets] = await Promise.all([listCategories(), getCatalogFacets()]);
  } catch (error) {
    console.error("Search filters could not load:", error);
    unavailable = true;
  }

  if (parsed.success && hasCriteria) {
    try {
      result = await discoverCatalogProducts(query);
    } catch (error) {
      console.error("Search query failed:", error);
      unavailable = true;
    }
  }

  return (
    <StorefrontShell categories={categories}>
      <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-contrast">
            Find your piece
          </p>
          <h1 className="font-display mt-2 text-4xl text-plum sm:text-5xl">
            Search Shringaar
          </h1>
          <form action="/search" className="mt-6 flex gap-2" role="search">
            <label className="sr-only" htmlFor="store-search">
              Search products by name, description, category, material, stone, or SKU
            </label>
            <input
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-control border border-border bg-white px-4 text-sm text-plum placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              defaultValue={query.q}
              id="store-search"
              maxLength={100}
              minLength={2}
              name="q"
              placeholder="Try jhumkas, pearls, Kundan, or a SKU"
              type="search"
            />
            <button
              className="min-h-12 rounded-control bg-plum px-5 text-sm font-semibold text-white hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              type="submit"
            >
              Search
            </button>
          </form>
        </header>

        {!parsed.success && (
          <p className="mb-4 rounded-control border border-error/20 bg-white p-3 text-sm text-error" role="alert">
            One or more search filters are invalid. Correct them and try again.
          </p>
        )}
        {unavailable && (
          <p className="mb-4 rounded-control border border-error/20 bg-white p-3 text-sm text-error" role="status">
            Search filters or products could not be loaded right now. Please try again shortly.
          </p>
        )}

        {hasCriteria ? (
          <>
            <div className="mb-4 mt-7">
              <h2 className="font-display text-2xl text-plum">
                {query.q ? `Results for “${query.q}”` : "Matching pieces"}
              </h2>
            </div>
            <DiscoveryListing
              action="/search"
              facets={facets}
              query={query}
              result={result}
              products={result?.products ?? []}
              unavailable={unavailable}
              emptyDescription={
                unavailable
                  ? "The catalogue could not be reached."
                  : "No products match these filters. Try removing a filter or changing your search."
              }
              emptyTitle={unavailable ? "Search unavailable" : "No matching pieces"}
              showKeyword
            />
          </>
        ) : (
          <div className="mt-7 rounded-card border border-border bg-white p-6 sm:p-8">
            <h2 className="font-display text-2xl text-plum">Browse by category</h2>
            {categories.length ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm text-plum hover:border-gold/50 hover:bg-ivory"
                      href={`/categories/${category.slug}`}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Browse links will appear when the catalogue is available.
              </p>
            )}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
