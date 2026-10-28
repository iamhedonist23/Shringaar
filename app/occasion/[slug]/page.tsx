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

const occasionLabels = {
  bridal: "Bridal",
  festive: "Festive",
  "daily-wear": "Daily Wear",
  "office-wear": "Office Wear",
} as const;
type OccasionSlug = keyof typeof occasionLabels;

function isOccasionSlug(slug: string): slug is OccasionSlug {
  return Object.hasOwn(occasionLabels, slug);
}

type OccasionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: OccasionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const label = isOccasionSlug(slug) ? occasionLabels[slug] : undefined;
  return { title: `${label || "Occasion"} jewellery | Shringaar` };
}

export default async function OccasionPage({ params, searchParams }: OccasionPageProps) {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const parsedSlug = slugParamSchema.safeParse(slug);
  if (!parsedSlug.success || !isOccasionSlug(slug)) notFound();
  const occasion = occasionLabels[slug];
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
      result = await discoverCatalogProducts({
        ...query,
        occasion: query.occasion ?? occasion,
      });
    }
  } catch (caught) {
    console.error("Occasion page catalog load failed:", caught);
    error = true;
  }

  return (
    <CatalogPage
      categories={categories}
      description={`Explore imitation jewellery selected for ${occasionLabels[slug].toLowerCase()} moments.`}
      error={error}
      eyebrow="Style the moment"
      products={result?.products ?? []}
      result={result}
      facets={facets}
      query={{ ...query, occasion: query.occasion ?? occasion }}
      action={`/occasion/${slug}`}
      title={`${occasion} jewellery`}
    />
  );
}
