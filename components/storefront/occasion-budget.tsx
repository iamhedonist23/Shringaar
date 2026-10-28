import Link from "next/link";
import { ArrowUpRight, Gem } from "lucide-react";
import { StorefrontSection } from "@/components/storefront/storefront-section";

const occasions = [
  {
    slug: "bridal",
    title: "For the big day",
    label: "Bridal",
    tone: "from-[#ead4bd] to-[#f8eadc]",
  },
  {
    slug: "festive",
    title: "A little celebration",
    label: "Festive",
    tone: "from-[#e9c6c2] to-[#f8e7df]",
  },
  {
    slug: "daily-wear",
    title: "Your everyday favourites",
    label: "Daily wear",
    tone: "from-[#d9dfd1] to-[#f1f0e4]",
  },
  {
    slug: "office-wear",
    title: "Understated polish",
    label: "Office wear",
    tone: "from-[#d8d4df] to-[#f0e9ee]",
  },
];

const budgets = [
  { slug: "under-1000", label: "Under ₹1,000", detail: "Small joys, lovely details" },
  { slug: "under-1500", label: "Under ₹1,500", detail: "Everyday, elevated" },
  { slug: "under-3000", label: "Under ₹3,000", detail: "A statement to remember" },
  { slug: "under-6000", label: "Under ₹6,000", detail: "The occasion edit" },
];

export function OccasionSection() {
  return (
    <StorefrontSection
      description="Find a finishing touch for the moments that matter to you."
      eyebrow="Made for your moments"
      title="Shop by occasion"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {occasions.map((occasion) => (
          <Link
            className={`group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-card bg-gradient-to-br ${occasion.tone} p-4 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:min-h-60 sm:p-5`}
            href={`/occasion/${occasion.slug}`}
            key={occasion.slug}
          >
            <Gem aria-hidden="true" className="size-6 text-plum/55" />
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-plum/60">
                {occasion.label}
              </span>
              <span className="font-display mt-1 block text-xl leading-tight text-plum sm:text-2xl">
                {occasion.title}
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="absolute right-4 top-4 size-4 text-plum/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </div>
    </StorefrontSection>
  );
}

export function BudgetSection() {
  return (
    <StorefrontSection
      description="A thoughtful find for every kind of treat-yourself day."
      eyebrow="A little something"
      title="Shop by budget"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {budgets.map((budget) => (
          <Link
            className="group rounded-card border border-border bg-white p-5 transition hover:border-gold/50 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-6"
            href={`/budget/${budget.slug}`}
            key={budget.slug}
          >
            <span className="text-xs uppercase tracking-[0.16em] text-muted">
              Discover pieces
            </span>
            <span className="font-display mt-2 block text-2xl text-plum group-hover:text-gold">
              {budget.label}
            </span>
            <span className="mt-2 block text-sm text-muted">{budget.detail}</span>
          </Link>
        ))}
      </div>
    </StorefrontSection>
  );
}
