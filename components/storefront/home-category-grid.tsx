import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";
import type { StoreProduct } from "@/components/storefront/product-tile";

const categoryImageFallbacks = [
  "/images/festival-earrings.jpg",
  "/images/polki-necklace.jpg",
  "/images/layered-necklace.jpg",
  "/images/gold-bracelet.jpg",
];

export function HomeCategoryGrid({
  categories,
  products,
}: {
  categories: { name: string; slug: string; imageUrl: string | null }[];
  products: StoreProduct[];
}) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="shop-categories-title" className="py-12 sm:py-16 lg:py-20">
      <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-contrast">
            Find your favourite
          </p>
          <h2
            className="font-display mt-2 text-3xl tracking-tight text-plum sm:text-4xl"
            id="shop-categories-title"
          >
            Shop by category
          </h2>
        </div>
        <Link
          className="mb-1 inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold text-plum hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:text-sm"
          href="/search"
        >
          View all <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7">
        {categories.slice(0, 7).map((category, index) => {
          const matchedProduct = products.find(
            (product) => product.category.slug === category.slug,
          );
          const image =
            category.imageUrl ??
            matchedProduct?.imageUrls[0] ??
            categoryImageFallbacks[index % categoryImageFallbacks.length];

          return (
            <li key={category.slug}>
              <Link
                className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
                href={`/categories/${category.slug}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#efe4d8] shadow-card">
                  <ImageWithFallback
                    alt={`${category.name} jewellery`}
                    className="object-cover transition duration-500 ease-out group-hover:scale-[1.045]"
                    sizes="(max-width: 639px) 47vw, (max-width: 1023px) 31vw, 14vw"
                    src={image}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-plum/70 to-transparent" />
                  <span className="absolute inset-x-2 bottom-3 text-center font-display text-lg text-white drop-shadow sm:text-xl">
                    {category.name}
                  </span>
                </div>
                <span className="sr-only">Browse {category.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
