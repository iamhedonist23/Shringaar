import { CreditCard, Gem, Sparkles, Truck } from "lucide-react";

const benefits = [
  { icon: Truck, label: "Free shipping over ₹499" },
  { icon: CreditCard, label: "UPI, cards & cash on delivery" },
  { icon: Gem, label: "Imitation jewellery, thoughtfully selected" },
  { icon: Sparkles, label: "Styles for everyday and occasions" },
];

export function HomepageWhyStrip() {
  return (
    <section
      aria-label="Shopping with Shringaar"
      className="border-y border-gold/20 bg-white/70"
    >
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 sm:grid-cols-4 sm:gap-5 sm:px-6 sm:py-7 lg:px-8">
        {benefits.map(({ icon: Icon, label }) => (
          <li
            className="flex items-center gap-3 text-xs leading-5 text-plum sm:text-sm"
            key={label}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/25 bg-ivory text-gold-contrast">
              <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
