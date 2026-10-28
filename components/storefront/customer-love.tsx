import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { HomepageReveal } from "@/components/storefront/homepage-reveal";
import { customerTestimonials } from "@/data/storefront-bottom";

export function CustomerLove() {
  return (
    <HomepageReveal>
      <section
        aria-labelledby="customer-love-title"
        className="py-12 sm:py-16 lg:py-20"
      >
        <div className="mb-7 text-center sm:mb-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-contrast">
            Notes from our customers
          </p>
          <h2
            className="font-display mt-2 text-3xl tracking-tight text-plum sm:text-4xl"
            id="customer-love-title"
          >
            Customer love
          </h2>
        </div>
        {customerTestimonials.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-3">
            {customerTestimonials.map((testimonial) => (
              <li
                className="rounded-2xl border border-rose/60 bg-[#fff8f7] p-5 shadow-card sm:p-6"
                key={`${testimonial.name}-${testimonial.city}`}
              >
                <div aria-label="5 out of 5 stars" className="flex gap-1 text-gold-contrast">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span aria-hidden="true" key={index}>★</span>
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-6 text-plum">
                  “{testimonial.quote}”
                </blockquote>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-plum">
                    {testimonial.name}, {testimonial.city}
                  </p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-muted">
                    Verified buyer
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose/50 bg-gradient-to-br from-[#fff8f7] to-white px-6 py-8 text-center shadow-card sm:px-10 sm:py-10">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-rose/25 text-plum">
              <Heart aria-hidden="true" className="size-5" strokeWidth={1.6} />
            </span>
            <p className="font-display mt-4 text-xl text-plum sm:text-2xl">
              Your story belongs here.
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
              We are making space for verified customer reviews. Until then,
              explore the pieces and choose the one that feels like you.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-plum/20 bg-white px-5 text-sm font-semibold text-plum transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              href="/search"
            >
              Explore jewellery <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        )}
      </section>
    </HomepageReveal>
  );
}
