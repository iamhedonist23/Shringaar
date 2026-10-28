import Link from "next/link";
import type { StoreProduct } from "@/components/storefront/product-tile";
import { ProductTile } from "@/components/storefront/product-tile";

export function ProductGrid({
  products,
  columns = 4,
  emptyTitle = "Pieces are on their way",
  emptyDescription = "There are no products in this edit just yet. Explore another collection in the meantime.",
}: {
  products: StoreProduct[];
  columns?: 3 | 4;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-card border border-border bg-white px-6 py-12 text-center">
        <h2 className="font-display text-2xl text-plum">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
          {emptyDescription}
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center rounded-control bg-plum px-5 text-sm font-semibold text-white hover:bg-gold"
          href="/search"
        >
          Explore jewellery
        </Link>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 ${columns === 3 ? "xl:grid-cols-3" : "lg:grid-cols-4 lg:gap-x-6"}`}>
      {products.map((product, index) => (
        <ProductTile key={product.id} priority={index === 0} product={product} />
      ))}
    </div>
  );
}
