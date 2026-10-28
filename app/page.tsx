import Link from "next/link";
import { ArrowRight, Check, Gem, Sparkles, Truck } from "lucide-react";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";
import { HomeCategoryGrid } from "@/components/storefront/home-category-grid";
import { HomepageReveal } from "@/components/storefront/homepage-reveal";
import { HomepageWhyStrip } from "@/components/storefront/homepage-why-strip";
import { CustomerLove } from "@/components/storefront/customer-love";
import { ShringaarMoments } from "@/components/storefront/shringaar-moments";
import { NewsletterBanner } from "@/components/storefront/newsletter-banner";
import { OccasionSection, BudgetSection } from "@/components/storefront/occasion-budget";
import { ProductGrid } from "@/components/storefront/product-grid";
import type { StoreProduct } from "@/components/storefront/product-tile";
import { StorefrontSection } from "@/components/storefront/storefront-section";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import {
  listCategories,
  listCollections,
  listProducts,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

const trustPoints = [
  { icon: Truck, label: "Free shipping on orders above ₹499" },
  { icon: Check, label: "Product details before you choose" },
  { icon: Gem, label: "Thoughtful details, made for your moments" },
];

function heroImageSource(src: string) {
  if (!src.startsWith("/images/")) return src;

  const imageUrl = new URL(src, "http://shringaar.local");
  imageUrl.searchParams.set("hero", "1");
  return `${imageUrl.pathname}${imageUrl.search}${imageUrl.hash}`;
}

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  let collections: Awaited<ReturnType<typeof listCollections>> = [];
  let trending: StoreProduct[] = [];
  let arrivals: StoreProduct[] = [];
  let catalogUnavailable = false;

  try {
    [categories, collections, trending, arrivals] = await Promise.all([
      listCategories(),
      listCollections({ limit: 20 }),
      listProducts({ limit: 12, sort: "featured" }),
      listProducts({ limit: 12, sort: "newest" }),
    ]);
  } catch (error) {
    console.error("Homepage catalog load failed:", error);
    catalogUnavailable = true;
  }

  const bridalCollection = collections.find((item) => item.slug === "bridal-edit");
  const moments = [...trending, ...arrivals]
    .flatMap((product) =>
      product.imageUrls.slice(0, 1).map((imageUrl) => ({
        name: product.name,
        slug: product.slug,
        imageUrl,
      })),
    )
    .filter(
      (moment, index, allMoments) =>
        allMoments.findIndex((candidate) => candidate.imageUrl === moment.imageUrl) === index,
    )
    .slice(0, 6);

  return (
    <StorefrontShell categories={categories}>
      <section className="mx-auto grid max-w-7xl gap-7 px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-7 lg:min-h-[calc(100svh-9rem)] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10 lg:px-8 lg:py-8">
        <HomepageReveal className="relative z-10 py-2 lg:py-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/70 px-3 py-1.5 text-xs font-semibold text-plum">
            <Sparkles aria-hidden="true" className="size-3.5 text-gold" />
            A Little Extra Shringaar
          </span>
          <h1 className="font-display text-plum mt-5 max-w-2xl text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.03] tracking-tight">
            Little details.
            <br />
            <span className="text-gold italic">Lasting feeling.</span>
          </h1>
          <p className="text-muted mt-4 max-w-xl text-sm leading-6 sm:text-base">
            Jewellery for celebrations, everyday rituals, and everything in
            between.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-plum px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-contrast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              href="/search?sort=newest"
            >
              Shop New Arrivals <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-control border border-plum/25 bg-white/60 px-6 text-sm font-semibold text-plum transition hover:border-gold hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              href="/collections/bridal-edit"
            >
              Explore Bridal
            </Link>
          </div>
          <ul
            aria-label="Shopping details"
            className="mt-6 grid gap-2 text-xs text-muted sm:grid-cols-2 sm:gap-x-5"
          >
            {trustPoints.map(({ icon: Icon, label }) => (
              <li className="flex items-center gap-2" key={label}>
                <Icon aria-hidden="true" className="size-3.5 shrink-0 text-gold-contrast" />
                {label}
              </li>
            ))}
          </ul>
        </HomepageReveal>
        <HomepageReveal
          className="relative mx-auto w-full max-w-xl lg:max-w-none"
          delay={0.08}
        >
          <div className="absolute -left-4 top-8 size-28 rounded-full bg-rose/35 blur-3xl sm:size-44" />
          <div className="absolute -right-3 bottom-5 size-32 rounded-full bg-gold/20 blur-3xl sm:size-48" />
          <div className="relative grid grid-cols-[1.08fr_0.82fr] items-center gap-3 sm:gap-5">
            <div className="group relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#eadbc9] shadow-soft">
              <ImageWithFallback
                alt="A close-up of Shringaar festive earrings"
                className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
                loading="eager"
                sizes="(max-width: 1023px) 62vw, 42vw"
                src="/images/festival-earrings.jpg?hero=1"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum/75 via-plum/20 to-transparent p-4 pt-16 sm:p-6 sm:pt-20">
                <p className="font-display text-xl text-white sm:text-2xl">
                  Festive, your way
                </p>
                <Link
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-white/85 underline underline-offset-4"
                  href="/collections/festive-glow"
                >
                  Discover the edit <ArrowRight aria-hidden="true" className="size-3" />
                </Link>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-5">
              {trending[0] ? (
                <Link
                  className="group block translate-y-3 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-card transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:translate-y-5"
                  href={`/products/${trending[0].slug}`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#e7d9cc]">
                    <ImageWithFallback
                      alt={trending[0].name}
                      className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                      loading="eager"
                      sizes="(max-width: 1023px) 38vw, 28vw"
                      src={heroImageSource(trending[0].imageUrls[0])}
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold-contrast">
                      A piece to love
                    </p>
                    <p className="font-display mt-1 line-clamp-1 text-base text-plum sm:text-lg">
                      {trending[0].name}
                    </p>
                    {trending[0].variants[0] && (
                      <p className="mt-1 text-sm font-semibold text-plum">
                        ₹
                        {trending[0].variants[0].price
                          .toLocaleString("en-IN")}
                      </p>
                    )}
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-plum">
                      Explore piece <ArrowRight aria-hidden="true" className="size-3.5" />
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="relative aspect-[4/5] translate-y-3 overflow-hidden rounded-[1.5rem] bg-[#e7d9cc] shadow-card sm:translate-y-5">
                  <ImageWithFallback
                    alt="Layered necklace styled for everyday wear"
                    className="object-cover"
                    loading="eager"
                    sizes="(max-width: 1023px) 38vw, 28vw"
                    src="/images/layered-necklace.jpg?hero=1"
                  />
                </div>
              )}
            </div>
          </div>
        </HomepageReveal>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {catalogUnavailable && (
          <div
            className="mt-8 rounded-card border border-error/20 bg-white px-5 py-4 text-sm text-plum"
            role="status"
          >
            We couldn’t load the collection right now. Please try again shortly.
          </div>
        )}

        <HomeCategoryGrid categories={categories} products={[...trending, ...arrivals]} />

        <StorefrontSection
          description="Customer favourites and statement-making details, selected from the current collection."
          eyebrow="The pieces to know"
          href="/collections/festive-glow"
          title="Trending now"
        >
          <ProductGrid
            emptyDescription={
              catalogUnavailable
                ? "The product collection is temporarily unavailable."
                : undefined
            }
            emptyTitle={catalogUnavailable ? "Collection unavailable" : undefined}
            products={trending}
          />
        </StorefrontSection>

        <StorefrontSection
          description="Fresh finds from the Shringaar collection."
          eyebrow="Just arrived"
          href="/search"
          title="New arrivals"
        >
          <ProductGrid
            emptyDescription={
              catalogUnavailable
                ? "The product collection is temporarily unavailable."
                : undefined
            }
            emptyTitle={catalogUnavailable ? "Collection unavailable" : undefined}
            products={arrivals}
          />
        </StorefrontSection>

        <OccasionSection />
        <BudgetSection />

        <section className="pb-12 sm:pb-16">
          <div className="relative grid min-h-[320px] overflow-hidden rounded-[2rem] border border-gold/25 bg-[#35162c] sm:min-h-[380px] lg:grid-cols-[1fr_1fr]">
            <div className="relative z-10 flex flex-col justify-center p-6 sm:p-10 lg:p-14">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e5c57a]">
                Find your bridal sparkle
              </span>
              <h2 className="font-display mt-3 max-w-lg text-4xl leading-tight text-white sm:text-5xl">
                For the days that become stories.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
                Discover jewellery selected for celebrations, ceremonies, and
                the moments you will remember.
              </p>
              <Link
                className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-control border border-[#e5c57a]/50 bg-[#e5c57a] px-5 text-sm font-semibold text-plum transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                href="/collections/bridal-edit"
              >
                Shop the bridal edit <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="absolute inset-0 opacity-35 lg:relative lg:opacity-100">
              <ImageWithFallback
                alt="Layered necklace from the Shringaar bridal-inspired edit"
                className="object-cover"
                sizes="(max-width: 1023px) 100vw, 50vw"
                src={bridalCollection?.imageUrl || "/images/layered-necklace.jpg"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#35162c] via-[#35162c]/70 to-transparent lg:from-[#35162c]/10 lg:via-transparent" />
            </div>
          </div>
        </section>

        <StorefrontSection
          description="Explore edits curated around a feeling, a finish, or a day worth dressing up for."
          eyebrow="A story in every edit"
          href="/collections/festive-glow"
          title="Explore collections"
        >
          {collections.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {collections.map((collection) => (
                <Link
                  className="group overflow-hidden rounded-card border border-border bg-white transition hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  href={`/collections/${collection.slug}`}
                  key={collection.id}
                >
                  <div className="relative aspect-[5/4] bg-[#f1e9dc]">
                    <ImageWithFallback
                      alt={collection.name}
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                      src={collection.imageUrl || collection.products[0]?.product.imageUrls[0]}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-xl text-plum">{collection.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                      {collection.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <ProductGrid
              emptyTitle={
                catalogUnavailable ? "Collections unavailable" : "More edits coming soon"
              }
              products={[]}
            />
          )}
        </StorefrontSection>
      </div>

      <HomepageWhyStrip />
      <CustomerLove />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ShringaarMoments
          instagramUrl={process.env.NEXT_PUBLIC_INSTAGRAM_URL}
          moments={moments}
        />
      </div>
      <NewsletterBanner />
    </StorefrontShell>
  );
}
