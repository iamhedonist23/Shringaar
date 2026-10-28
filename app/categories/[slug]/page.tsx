import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/storefront/catalog-page";
import {
  discoverCatalogProducts,
  getCatalogFacets,
  getCategoryBySlug,
  listCategories,
  type CatalogFacets,
} from "@/lib/catalog";
import { catalogDiscoveryQuerySchema } from "@/lib/catalog-schemas";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategoryBySlug(slug);
    return {
      title: category?.seoTitle || `${category?.name || "Jewellery"} | Shringaar`,
      description: category?.seoDescription || category?.description || undefined,
    };
  } catch {
    return { title: "Jewellery | Shringaar" };
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const parsedQuery = catalogDiscoveryQuerySchema.safeParse(rawQuery);
  const query = parsedQuery.success
    ? parsedQuery.data
    : catalogDiscoveryQuerySchema.parse({});
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let category: Awaited<ReturnType<typeof getCategoryBySlug>> = null;
  let facets: CatalogFacets = {
    categories: [],
    occasions: ["Bridal", "Festive", "Daily Wear", "Office Wear"],
    materials: [],
    finishes: [],
    stoneTypes: [],
    colors: [],
  };
  let result: Awaited<ReturnType<typeof discoverCatalogProducts>> | null = null;
  let pageQuery = { ...query, category: query.category ?? slug };
  let error = false;

  try {
    [categories, category, facets] = await Promise.all([
      listCategories(),
      getCategoryBySlug(slug),
      getCatalogFacets(),
    ]);
    if (!category) notFound();
    const categoryFacet = facets.categories.find((item) => item.slug === slug);
    const parentFacet = categoryFacet?.parentId
      ? facets.categories.find((item) => item.id === categoryFacet.parentId)
      : undefined;
    pageQuery = {
      ...query,
      category: query.category ?? slug,
      parentCategory: query.parentCategory ?? parentFacet?.slug ?? (categoryFacet ? slug : undefined),
    };
    if (parsedQuery.success) {
      result = await discoverCatalogProducts(pageQuery);
    }
  } catch (caught) {
    if (caught && typeof caught === "object" && "digest" in caught) throw caught;
    console.error("Category page catalog load failed:", caught);
    error = true;
  }

  return (
    <CatalogPage
      categories={categories}
      description={category?.description}
      error={error}
      eyebrow="Browse by style"
      products={result?.products ?? []}
      result={result}
      facets={facets}
      query={pageQuery}
      action={`/categories/${slug}`}
      title={category?.name || "Explore jewellery"}
    />
  );
}
