import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/storefront/catalog-page";
import {
  discoverCatalogProducts,
  getCatalogFacets,
  listCategories,
  type CatalogFacets,
} from "@/lib/catalog";
import {
  catalogDiscoveryQuerySchema,
  slugParamSchema,
} from "@/lib/catalog-schemas";

export const dynamic = "force-dynamic";

const budgetRanges: Record<string, { label: string; maxPrice: number }> = {
  "under-1000": { label: "Under ₹1,000", maxPrice: 1000 },
  "under-1500": { label: "Under ₹1,500", maxPrice: 1500 },
  "under-3000": { label: "Under ₹3,000", maxPrice: 3000 },
  "under-6000": { label: "Under ₹6,000", maxPrice: 6000 },
};

type BudgetPageProps = {
  params: Promise<{ range: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: BudgetPageProps): Promise<Metadata> {
  const { range } = await params;
  return { title: `${budgetRanges[range]?.label || "Shop by budget"} | Shringaar` };
}

export default async function BudgetPage({ params, searchParams }: BudgetPageProps) {
  const [{ range }, rawQuery] = await Promise.all([params, searchParams]);
  const parsedRange = slugParamSchema.safeParse(range);
  const budget = budgetRanges[range];
  if (!parsedRange.success || !budget) notFound();
  const parsedQuery = catalogDiscoveryQuerySchema.safeParse(rawQuery);
  const query = parsedQuery.success
    ? parsedQuery.data
    : catalogDiscoveryQuerySchema.parse({});

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
  let error = false;
  try {
    [categories, facets] = await Promise.all([
      listCategories(),
      getCatalogFacets(),
    ]);
    if (parsedQuery.success) {
      result = await discoverCatalogProducts(
        { ...query, sort: query.sort === "relevance" ? "newest" : query.sort },
        undefined,
        budget.maxPrice,
      );
    }
  } catch (caught) {
    console.error("Budget page catalog load failed:", caught);
    error = true;
  }

  return (
    <CatalogPage
      categories={categories}
      description={`Explore Shringaar pieces priced at or below ${budget.label.replace("Under ", "")}.`}
      error={error}
      eyebrow="A little something"
      products={result?.products ?? []}
      result={result}
      facets={facets}
      query={{
        ...query,
        sort: query.sort === "relevance" ? "newest" : query.sort,
        maxPrice: query.maxPrice ?? budget.maxPrice,
      }}
      action={`/budget/${range}`}
      title={budget.label}
    />
  );
}
