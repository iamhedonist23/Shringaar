import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import {
  DiscoveryListing,
} from "@/components/storefront/discovery-controls";
import {
  discoverCatalogProducts,
  getCatalogFacets,
  getCollectionBySlug,
  listCategories,
  type CatalogFacets,
} from "@/lib/catalog";
import { catalogDiscoveryQuerySchema, slugParamSchema } from "@/lib/catalog-schemas";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const collection = await getCollectionBySlug(slug);
    return {
      title: collection?.seoTitle || `${collection?.name || "Collection"} | Shringaar`,
      description: collection?.seoDescription || collection?.description || undefined,
    };
  } catch {
    return { title: "Collection | Shringaar" };
  }
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const parsedSlug = slugParamSchema.safeParse(slug);
  if (!parsedSlug.success) notFound();
  const parsed = catalogDiscoveryQuerySchema.safeParse(rawQuery);
  const query = parsed.success ? parsed.data : catalogDiscoveryQuerySchema.parse({});
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let collection: Awaited<ReturnType<typeof getCollectionBySlug>> = null;
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
  let collectionLookupSucceeded = false;

  try {
    [categories, collection, facets] = await Promise.all([
      listCategories(),
      getCollectionBySlug(parsedSlug.data),
      getCatalogFacets(),
    ]);
    collectionLookupSucceeded = true;
  } catch (error) {
    console.error("Collection page catalog load failed:", error);
    unavailable = true;
  }
  if (collectionLookupSucceeded && !collection) notFound();

  if (parsed.success) {
    try {
      result = await discoverCatalogProducts(query, parsedSlug.data);
    } catch (error) {
      console.error("Collection products could not load:", error);
      unavailable = true;
    }
  }

  return (
    <StorefrontShell categories={categories}>
      <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-contrast">
            Curated for you
          </p>
          <h1 className="font-display mt-2 text-4xl tracking-tight text-plum sm:text-5xl">
            {collection?.name || "Explore the collection"}
          </h1>
          {collection?.description && (
            <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
              {collection.description}
            </p>
          )}
        </header>
        {!parsed.success && (
          <p className="mb-4 rounded-control border border-error/20 bg-white p-3 text-sm text-error" role="alert">
            One or more collection filters are invalid. Correct them and try again.
          </p>
        )}
        {unavailable && (
          <p className="mb-4 rounded-control border border-error/20 bg-white p-3 text-sm text-error" role="status">
            The collection could not be loaded right now. Please try again shortly.
          </p>
        )}
        <DiscoveryListing
          action={`/collections/${slug}`}
          facets={facets}
          query={query}
          showKeyword
          result={result}
          products={result?.products ?? []}
          unavailable={unavailable}
          emptyDescription="No pieces match these filters. Try removing a filter or changing your search."
          emptyTitle="No matching pieces"
        />
      </main>
    </StorefrontShell>
  );
}
