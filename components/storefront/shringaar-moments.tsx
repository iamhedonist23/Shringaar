import Link from "next/link";
import { ArrowUpRight, Instagram } from "lucide-react";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";
import { HomepageReveal } from "@/components/storefront/homepage-reveal";

export type HomepageMoment = {
  name: string;
  slug: string;
  imageUrl: string | null;
};

const fallbackImages = [
  { name: "Festive earrings", imageUrl: "/images/festival-earrings.jpg" },
  { name: "Polki-inspired necklace", imageUrl: "/images/polki-necklace.jpg" },
  { name: "Layered necklace", imageUrl: "/images/layered-necklace.jpg" },
  { name: "Gold-tone bracelet", imageUrl: "/images/gold-bracelet.jpg" },
  { name: "Statement earrings", imageUrl: "/images/festival-earrings.jpg" },
  { name: "Layered jewellery", imageUrl: "/images/layered-necklace.jpg" },
];

export function ShringaarMoments({
  moments,
  instagramUrl,
}: {
  moments: HomepageMoment[];
  instagramUrl?: string;
}) {
  const tiles = Array.from({ length: 6 }, (_, index) => {
    const moment = moments[index];
    const fallback = fallbackImages[index];
    return {
      name: moment?.name ?? fallback.name,
      slug: moment?.slug,
      imageUrl: moment?.imageUrl ?? fallback.imageUrl,
    };
  });

  return (
    <HomepageReveal>
      <section
        aria-labelledby="shringaar-moments-title"
        className="py-12 sm:py-16 lg:py-20"
      >
        <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-contrast">
              A little inspiration
            </p>
            <h2
              className="font-display mt-2 text-3xl tracking-tight text-plum sm:text-4xl"
              id="shringaar-moments-title"
            >
              #ShringaarMoments
            </h2>
            <p className="mt-2 text-sm text-muted">
              A closer look at pieces from the current collection.
            </p>
          </div>
          {instagramUrl ? (
            <a
              className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-plum/20 bg-white px-5 text-sm font-semibold text-plum transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              href={instagramUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Instagram aria-hidden="true" className="size-4" />
              Follow us on Instagram
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          ) : (
            <Link
              className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-plum/20 bg-white px-5 text-sm font-semibold text-plum transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              href="/search"
            >
              Explore the collection
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:gap-4">
          {tiles.map((tile, index) => (
            <li key={`${tile.slug ?? "editorial"}-${index}`}>
              <Link
                aria-label={tile.slug ? `View ${tile.name}` : `Explore ${tile.name}`}
                className="group relative block aspect-square overflow-hidden rounded-xl bg-[#efe4d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 sm:rounded-2xl"
                href={tile.slug ? `/products/${tile.slug}` : "/search"}
              >
                <ImageWithFallback
                  alt={tile.name}
                  className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width: 639px) 48vw, (max-width: 1023px) 31vw, 24vw"
                  src={tile.imageUrl}
                />
                <span className="absolute inset-0 grid place-items-center bg-plum/0 text-white transition group-hover:bg-plum/35 group-focus-visible:bg-plum/35">
                  <span className="translate-y-2 rounded-full border border-white/80 px-4 py-2 text-xs font-semibold opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    View piece
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </HomepageReveal>
  );
}
