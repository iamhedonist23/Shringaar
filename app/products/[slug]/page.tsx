import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Gem, PackageCheck, RotateCcw } from "lucide-react";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { ProductGrid } from "@/components/storefront/product-grid";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import type { StoreProduct } from "@/components/storefront/product-tile";
import {
  getProductBySlug,
  getRelatedProducts,
  listCategories,
} from "@/lib/catalog";
import { buildProductSpecificationRows } from "@/lib/product-specifications";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function productPath(slug: string) {
  return `/products/${encodeURIComponent(slug)}`;
}

function absoluteUrl(path: string) {
  const origin = process.env.AUTH_URL;
  if (!origin) return path;
  try {
    return new URL(path, origin).toString();
  } catch {
    return path;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return { title: "Piece not found | Shringaar" };
    const description =
      product.seoDescription ||
      product.shortDescription ||
      product.description.slice(0, 300);
    return {
      title: product.seoTitle || `${product.name} | Shringaar`,
      description,
      alternates: { canonical: absoluteUrl(productPath(product.slug)) },
      openGraph: {
        type: "website",
        title: product.seoTitle || `${product.name} | Shringaar`,
        description,
        url: absoluteUrl(productPath(product.slug)),
        images: product.imageUrls.slice(0, 1).map((url) => ({
          url: absoluteUrl(url),
          alt: product.name,
        })),
      },
    };
  } catch {
    return { title: "Jewellery | Shringaar" };
  }
}

function ProductStructuredData({
  product,
  canonical,
}: {
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
  canonical: string;
}) {
  const description =
    product.shortDescription || product.description;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    sku: product.variants.length === 1 ? product.variants[0]?.sku : undefined,
    image: product.imageUrls.map((image) => absoluteUrl(image)),
    brand: { "@type": "Brand", name: "Shringaar" },
    category: product.category.name,
    material: product.material,
    url: canonical,
    ...(product.variants.length > 0
      ? {
          offers: product.variants.map((variant) => ({
            "@type": "Offer",
            sku: variant.sku,
            name: variant.name,
            price: variant.price.toFixed(2),
            priceCurrency: "INR",
            availability:
              variant.inventoryQuantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url: canonical,
            itemCondition: "https://schema.org/NewCondition",
          })),
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category.name,
        item: absoluteUrl(`/categories/${product.category.slug}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: canonical,
      },
    ],
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
    </>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let product: Awaited<ReturnType<typeof getProductBySlug>> = null;
  let relatedProducts: StoreProduct[] = [];
  let unavailable = false;

  try {
    [categories, product] = await Promise.all([
      listCategories(),
      getProductBySlug(slug),
    ]);
  } catch (error) {
    console.error("Product page catalog load failed:", error);
    unavailable = true;
  }

  if (!product && !unavailable) notFound();
  if (!product) {
    return (
      <StorefrontShell categories={categories}>
        <div
          className="mx-auto min-h-[60vh] max-w-3xl px-4 py-16 text-center sm:px-6"
          role="status"
        >
          <h1 className="font-display text-3xl text-plum">Piece unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            We couldn’t load this product right now. Please try again shortly.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center rounded-control bg-plum px-5 text-sm font-semibold text-white hover:bg-gold"
            href="/search"
          >
            Browse jewellery
          </Link>
        </div>
      </StorefrontShell>
    );
  }

  const canonical = absoluteUrl(productPath(product.slug));
  try {
    relatedProducts = await getRelatedProducts({
      productId: product.id,
      categoryId: product.categoryId,
      collectionIds: product.collections.map(({ collectionId }) => collectionId),
      limit: 4,
    });
  } catch (error) {
    console.error("Related products could not be loaded:", error);
  }

  const { rows: specificationRows, care } = buildProductSpecificationRows({
    material: product.material,
    finish: product.plating,
    stoneType: product.stoneType,
    specifications: product.specifications,
  });
  const isSizeRelevant = ["rings", "bangles"].includes(product.category.slug);

  return (
    <StorefrontShell categories={categories}>
      <ProductStructuredData product={product} canonical={canonical} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-muted sm:text-sm">
            <li>
              <Link className="hover:text-plum" href="/">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                className="hover:text-plum"
                href={`/categories/${product.category.slug}`}
              >
                {product.category.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="max-w-[55vw] truncate font-medium text-plum">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-7 lg:grid-cols-2 lg:gap-14">
          <ProductGallery productName={product.name} imageUrls={product.imageUrls} />

          <article className="min-w-0 py-1 sm:py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-contrast">
              {product.category.name}
            </p>
            <h1 className="font-display mt-3 text-4xl leading-tight text-plum sm:text-5xl">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="mt-4 text-base leading-7 text-muted">
                {product.shortDescription}
              </p>
            )}

            <ProductPurchasePanel
              hasSizeOptions={isSizeRelevant}
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
              }}
              variants={product.variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                name: variant.name,
                color: variant.color,
                options: variant.options,
                price: variant.price,
                compareAtPrice: variant.compareAtPrice,
                inventoryQuantity: variant.inventoryQuantity,
              }))}
            />

            <section aria-labelledby="product-description-heading" className="mt-8 border-t border-border pt-6">
              <h2
                className="font-display text-2xl text-plum"
                id="product-description-heading"
              >
                About this piece
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-plum/80">
                {product.description}
              </p>
            </section>

            <section aria-labelledby="product-specifications-heading" className="mt-7">
              <h2
                className="font-display text-2xl text-plum"
                id="product-specifications-heading"
              >
                Details & specifications
              </h2>
              <dl className="mt-4 divide-y divide-border border-y border-border">
                {specificationRows.map(({ label, value }) => (
                  <div
                    className="grid grid-cols-[minmax(7rem,0.8fr)_minmax(0,1.2fr)] gap-4 py-3.5 text-sm sm:grid-cols-2 sm:py-4 sm:text-base"
                    key={label}
                  >
                    <dt className="text-muted">{label}</dt>
                    <dd className="break-words text-right font-medium text-plum">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="care-heading" className="mt-7 rounded-card border border-border bg-white p-4 sm:p-5">
              <div className="flex gap-3">
                <Gem aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <h2 className="font-semibold text-plum" id="care-heading">
                    Care instructions
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {care
                      ? care
                      : "Care instructions have not been provided for this product."}
                  </p>
                </div>
              </div>
            </section>

            <section aria-labelledby="shipping-heading" className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-card border border-border bg-white p-4">
                <PackageCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <h2 className="text-sm font-semibold text-plum" id="shipping-heading">
                    Shipping
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Shipping options and charges are not listed in the product catalogue.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-card border border-border bg-white p-4">
                <RotateCcw aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <h2 className="text-sm font-semibold text-plum">Returns</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Return eligibility and terms have not been provided. Please confirm the
                    store policy before purchase.
                  </p>
                </div>
              </div>
            </section>
          </article>
        </div>

        {relatedProducts.length > 0 && (
          <section aria-labelledby="related-products-heading" className="mt-12 border-t border-border pt-8 sm:mt-16 sm:pt-10">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-contrast">
                  Keep exploring
                </p>
                <h2
                  className="font-display mt-2 text-3xl text-plum"
                  id="related-products-heading"
                >
                  Related pieces
                </h2>
              </div>
              <Link
                className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-plum hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                href={`/categories/${product.category.slug}`}
              >
                Browse {product.category.name}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <ProductGrid products={relatedProducts} />
          </section>
        )}
      </div>
    </StorefrontShell>
  );
}
