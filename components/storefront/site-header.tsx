"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { hydrateCart, useCartStore } from "@/lib/cart-store";
import { CustomerAccountControl, MobileAccountLinks } from "@/components/account/user-menu";

type HeaderCategory = { name: string; slug: string };

export function SiteHeader({ categories }: { categories: HeaderCategory[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const cartCount = useCartStore((state) =>
    state.lines.reduce((count, line) => count + line.quantity, 0),
  );
  const cartHydrated = useCartStore((state) => state.hasHydrated);

  useEffect(() => {
    void hydrateCart();
  }, []);

  useEffect(() => {
    function updateScrolledState() {
      setIsScrolled(window.scrollY > 8);
    }

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolledState);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const links = [
    { href: "/collections/festive-glow", label: "Festive Edit", highlighted: true },
    { href: "/collections/bridal-edit", label: "Bridal", highlighted: true },
    { href: "/occasion/daily-wear", label: "Everyday" },
    { href: "/budget/under-1500", label: "Under ₹1,500" },
  ];

  return (
    <header
      className={`sticky top-0 isolate z-40 border-b border-border/80 bg-ivory transition-shadow duration-200 ${
        isScrolled ? "shadow-[0_8px_24px_rgba(74,31,61,0.08)]" : ""
      }`}
    >
      <div className="bg-plum px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white sm:text-xs">
        Jewellery for the moments you make your own
      </div>
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6 lg:gap-8 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-controls="mobile-store-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="grid size-11 shrink-0 place-items-center rounded-full text-plum hover:bg-plum/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        <Link
          aria-label="Shringaar home"
          className="flex min-w-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          href="/"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            alt=""
            className="h-11 w-[112px] object-contain sm:h-12 sm:w-[124px]"
            height={572}
            loading="eager"
            src="/images/shringaar-logo.png"
            width={1414}
          />
        </Link>
        </div>

        <form
          action="/search"
          className="mx-auto hidden min-w-0 w-full max-w-xl items-center rounded-full border border-border bg-white px-4 focus-within:ring-2 focus-within:ring-gold/60 lg:flex"
          role="search"
        >
          <Search aria-hidden="true" className="text-muted size-4 shrink-0" />
          <input
            aria-label="Search jewellery"
            className="storefront-search-input h-10 min-w-0 flex-1 appearance-none border-0 bg-transparent px-3 text-sm text-plum outline-none placeholder:text-muted focus-visible:ring-0 focus-visible:shadow-none"
            maxLength={100}
            minLength={2}
            name="q"
            placeholder="Search earrings, necklaces..."
            required
            type="search"
          />
          <button
            aria-label="Submit search"
            className="text-plum rounded-full p-2 hover:bg-plum/5"
            type="submit"
          >
            <Search aria-hidden="true" className="size-4" />
          </button>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link
            aria-label="Explore jewellery"
            className="hidden size-11 shrink-0 place-items-center rounded-full px-2 text-sm font-semibold text-plum hover:bg-plum/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:flex sm:w-auto sm:gap-2 sm:px-3"
            href="/search"
          >
            <Search aria-hidden="true" className="size-5 sm:hidden" />
            <span className="hidden sm:inline">Explore</span>
            <span className="sr-only sm:hidden">Search jewellery</span>
          </Link>
          <CustomerAccountControl />
          <Link
            aria-label={`Shopping bag${cartHydrated ? `, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : ""}`}
            className="relative grid size-11 shrink-0 place-items-center rounded-full text-plum hover:bg-plum/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            href="/cart"
          >
            <ShoppingBag aria-hidden="true" className="size-5" />
            {cartHydrated && cartCount > 0 && (
              <span className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold leading-5 text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <form
        action="/search"
        className="mx-4 mb-3 flex items-center rounded-full border border-border bg-white px-3 focus-within:ring-2 focus-within:ring-gold/60 lg:hidden"
        role="search"
      >
        <Search aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <input
          aria-label="Search jewellery"
          className="storefront-search-input h-10 min-w-0 flex-1 appearance-none border-0 bg-transparent px-3 text-sm text-plum outline-none focus-visible:ring-0 focus-visible:shadow-none"
          maxLength={100}
          minLength={2}
          name="q"
          placeholder="Search earrings, necklaces..."
          required
          type="search"
        />
        <button
          aria-label="Submit search"
          className="rounded-full p-2 text-plum hover:bg-plum/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          type="submit"
        >
          <Search aria-hidden="true" className="size-4" />
        </button>
      </form>

      <nav
        aria-label="Shop categories"
        className="mx-auto hidden max-w-7xl items-center justify-center gap-x-6 overflow-x-auto px-6 pb-3 lg:flex"
      >
        {categories.map((category) => (
          <Link
            aria-current={pathname === `/categories/${category.slug}` ? "page" : undefined}
            className={`group relative whitespace-nowrap py-1 text-xs font-medium transition after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform hover:text-gold-contrast hover:after:scale-x-100 ${
              pathname === `/categories/${category.slug}`
                ? "text-plum after:scale-x-100"
                : "text-plum/80"
            }`}
            href={`/categories/${category.slug}`}
            key={category.slug}
          >
            {category.name}
          </Link>
        ))}
        {links.slice(0, 2).map((link) => (
          <Link
            aria-current={pathname === link.href ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
              link.highlighted
                ? "bg-gold/10 text-plum hover:bg-gold/20"
                : "text-plum hover:text-gold-contrast"
            }`}
            href={link.href}
            key={link.href}
          >
            {link.label}
            {link.highlighted && (
              <Sparkles aria-hidden="true" className="size-3 text-gold-contrast" />
            )}
          </Link>
        ))}
      </nav>

      {menuOpen && (
        <nav
          aria-label="Mobile shop navigation"
          className="border-t border-border bg-white px-4 py-4 shadow-soft lg:hidden"
          id="mobile-store-navigation"
        >
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[...categories.map(({ name, slug }) => ({ href: `/categories/${slug}`, label: name })), ...links].map(
              (link) => (
                <Link
                  className={`rounded-control px-3 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    "highlighted" in link && link.highlighted
                      ? "bg-gold/10 text-plum hover:bg-gold/20"
                      : "text-plum hover:bg-ivory"
                  }`}
                  href={link.href}
                  key={link.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
          <MobileAccountLinks
            onNavigate={() => setMenuOpen(false)}
            returnFocusTarget={() => menuButtonRef.current?.focus()}
          />
        </nav>
      )}
    </header>
  );
}
