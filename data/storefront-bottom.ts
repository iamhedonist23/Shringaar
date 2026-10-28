export const footerLinkGroups = [
  {
    title: "Shop",
    links: [
      { href: "/categories/jhumkas", label: "Earrings & Jhumkas" },
      { href: "/categories/chandbalis", label: "Chandbalis" },
      { href: "/categories/necklaces", label: "Necklaces" },
      { href: "/categories/chokers", label: "Chokers" },
      { href: "/categories/bangles", label: "Bangles" },
      { href: "/categories/rings", label: "Rings" },
      { href: "/categories/maang-tikka", label: "Maang Tikkas" },
      { href: "/categories/bridal-sets", label: "Bridal Sets" },
      { href: "/categories/studs", label: "Stud Earrings" },
    ],
  },
  {
    title: "Collections",
    links: [
      { href: "/collections/festive-glow", label: "Festive Edit" },
      { href: "/collections/bridal-edit", label: "Bridal Edit" },
      { href: "/search?sort=newest", label: "New Arrivals" },
      { href: "/search?sort=featured", label: "Best Sellers" },
      { href: "/collections/everyday-adornment", label: "Everyday Adornment" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/account/orders", label: "Track an Order" },
      { href: "/cart", label: "Shipping & Payment" },
      { href: "/account/addresses", label: "Saved Addresses" },
      { href: "/search", label: "Find a Piece" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
] as const;

export const contactEmail = "shringaar.live@gmail.com";

export const socialPlatforms = [
  { label: "Instagram", env: "NEXT_PUBLIC_INSTAGRAM_URL", shortLabel: "IG" },
  { label: "Facebook", env: "NEXT_PUBLIC_FACEBOOK_URL", shortLabel: "f" },
  { label: "Pinterest", env: "NEXT_PUBLIC_PINTEREST_URL", shortLabel: "P" },
  { label: "YouTube", env: "NEXT_PUBLIC_YOUTUBE_URL", shortLabel: "YT" },
  { label: "WhatsApp", env: "NEXT_PUBLIC_WHATSAPP_URL", shortLabel: "WA" },
] as const;

export const customerTestimonials: {
  quote: string;
  name: string;
  city: string;
}[] = [];
