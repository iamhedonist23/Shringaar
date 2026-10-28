import Link from "next/link";
import type { listProducts } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";

export type StoreProduct = Awaited<ReturnType<typeof listProducts>>[number];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProductTile({
  product,
  priority = false,
}: {
  product: StoreProduct;
  priority?: boolean;
}) {
  const variant = product.variants[0];
  const image = product.imageUrls[0];
  const lowStock =
    variant && variant.inventoryQuantity > 0 && variant.inventoryQuantity <= 2;

  return (
    <article className="group min-w-0">
      <Link
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        href={`/products/${product.slug}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-[#f1e9dc]">
          <ImageWithFallback
            alt={product.name}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 639px) 48vw, (max-width: 1023px) 32vw, 25vw"
            src={image}
          />
          {(lowStock || product.featured) && (
            <div className="absolute left-3 top-3">
              {lowStock ? (
                <Badge tone="low-stock">Only {variant.inventoryQuantity} left</Badge>
              ) : (
                <Badge tone="bestseller">Featured</Badge>
              )}
            </div>
          )}
        </div>
        <div className="pt-3">
          <p className="text-muted text-[11px] uppercase tracking-[0.12em]">
            {product.category.name}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-plum group-hover:text-gold-contrast">
            {product.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {variant ? (
              <>
                <span className="text-sm font-semibold text-plum">
                  {inr.format(variant.price)}
                </span>
                {variant.compareAtPrice && (
                  <span className="text-xs text-muted line-through">
                    {inr.format(variant.compareAtPrice)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted">Price coming soon</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
