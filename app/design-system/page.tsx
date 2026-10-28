"use client";

import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Gem,
  Heart,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { AnimatedIcon } from "@/components/icons/animated-icon";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Drawer } from "@/components/ui/drawer";
import { LottieIllustration } from "@/components/ui/illustrations";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ProductCard } from "@/components/ui/product-card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { fadeUp, stagger } from "@/lib/motion";

const products = [
  {
    name: "Noor Kundan Statement Earrings",
    price: "₹2,490",
    compareAtPrice: "₹3,200",
    badge: "Bestseller",
    image: "/images/festival-earrings.jpg",
    hoverImage: "/images/festival-earrings.jpg",
  },
  {
    name: "Zari Pavé Bracelet",
    price: "₹1,850",
    badge: "New",
    image: "/images/gold-bracelet.jpg",
    hoverImage: "/images/gold-bracelet.jpg",
  },
  {
    name: "Meher Layered Necklace",
    price: "₹4,290",
    badge: "Only 2 left",
    image: "/images/layered-necklace.jpg",
    hoverImage: "/images/layered-necklace.jpg",
  },
  {
    name: "Midnight Gemstone Pendant",
    price: "₹3,490",
    badge: "New",
    image: "/images/polki-necklace.jpg",
    hoverImage: "/images/polki-necklace.jpg",
  },
];

const trustItems: { Icon: LucideIcon; label: string }[] = [
  { Icon: Truck, label: "Free shipping" },
  { Icon: ShieldCheck, label: "Secure payment" },
  { Icon: RefreshCw, label: "Easy exchange" },
  { Icon: Gem, label: "Quality checked" },
];

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className="scroll-mt-24 py-12 sm:py-16"
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.12 }}
      variants={fadeUp}
    >
      <p className="text-gold-contrast text-xs font-semibold uppercase tracking-[0.2em]">
        {eyebrow}
      </p>
      <h2 className="font-display text-plum mt-2 text-3xl sm:text-4xl">{title}</h2>
      <div className="mt-7">{children}</div>
    </motion.section>
  );
}

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const cartTargetRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const { toast } = useToast();

  function addToCart(productName: string) {
    setCartCount((count) => count + 1);
    toast(`${productName} added to your bag.`);
    window.setTimeout(() => setCartOpen(true), reduceMotion ? 0 : 320);
  }

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className={
        darkMode
          ? "bg-ivory text-ink dark min-h-screen"
          : "bg-ivory text-ink min-h-screen"
      }
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      transition={{ duration: reduceMotion ? 0 : 0.26, ease: "easeOut" }}
    >
      <header className="border-border/80 bg-ivory/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <a
            className="font-display text-plum text-2xl font-bold tracking-tight"
            href="#top"
          >
            Shringaar<span className="text-gold">.</span>
          </a>
          <nav
            aria-label="Design system sections"
            className="hidden items-center gap-6 md:flex"
          >
            {["Tokens", "Components", "Product cards", "Motion"].map((item) => (
              <a
                key={item}
                className="text-muted hover:text-plum text-xs font-medium transition"
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <AnimatePresence initial={false}>
              {searchOpen && (
                <motion.form
                  animate={{ opacity: 1, width: 190 }}
                  className="overflow-hidden"
                  exit={{ opacity: 0, width: 0 }}
                  initial={reduceMotion ? false : { opacity: 0, width: 0 }}
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    toast("Showing the latest Shringaar pieces.");
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    aria-label="Search jewellery"
                    autoFocus
                    className="h-10"
                    placeholder="Search jewellery"
                    type="search"
                  />
                </motion.form>
              )}
            </AnimatePresence>
            <Button
              aria-label={searchOpen ? "Close search" : "Open search"}
              onClick={() => setSearchOpen((value) => !value)}
              size="icon"
              variant="ghost"
            >
              {searchOpen ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Search aria-hidden="true" className="size-5" />
              )}
            </Button>
            <span ref={cartTargetRef} className="relative">
              <Button
                aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                className="relative"
                onClick={() => setCartOpen(true)}
                size="icon"
                variant="ghost"
              >
                <ShoppingBag aria-hidden="true" className="size-5" />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    animate={{ scale: 1, y: 0 }}
                    aria-hidden="true"
                    className="bg-rose text-plum absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full text-[10px] font-bold"
                    initial={reduceMotion ? false : { scale: 0.6, y: -3 }}
                    transition={{
                      duration: 0.22,
                      type: "spring",
                      stiffness: 420,
                      damping: 18,
                    }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Button>
            </span>
            <Button
              aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setDarkMode((value) => !value)}
              size="icon"
              variant="ghost"
            >
              <span aria-hidden="true" className="text-base">
                {darkMode ? "☼" : "◐"}
              </span>
            </Button>
            <Button
              aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
              className="md:hidden"
              onClick={() => setDrawerOpen((value) => !value)}
              size="icon"
              variant="ghost"
            >
              {drawerOpen ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div id="top" className="container">
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div
            aria-hidden="true"
            className="bg-rose/20 pointer-events-none absolute -right-16 -top-20 size-72 rounded-full blur-3xl"
          />
          <div className="relative max-w-3xl">
            <div className="border-gold/20 text-plum mb-5 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs font-medium">
              <Sparkles aria-hidden="true" className="text-gold size-3.5" />
              The Shringaar design language
            </div>
            <h1 className="font-display text-display-xl text-plum tracking-tight">
              Everyday moments,
              <br />
              <span className="text-gold italic">made luminous.</span>
            </h1>
            <p className="text-muted mt-5 max-w-xl text-sm leading-7 sm:text-base">
              An accessible, mobile-first foundation for affordable luxury. Thoughtful
              details, considered motion, and a little Indian celebration in every
              interaction.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  document
                    .getElementById("components")
                    ?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth" })
                }
              >
                Explore components <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
              <Button
                onClick={() => toast("Welcome to the Shringaar design system.")}
                variant="secondary"
              >
                Preview a toast
              </Button>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-3 lg:absolute lg:bottom-10 lg:right-5 lg:mt-0 lg:w-[42%] lg:grid-cols-2">
            <div className="rounded-card shadow-soft relative aspect-[4/5] overflow-hidden bg-[#e6d7c4]">
              <Image
                alt="Festive crystal earrings arranged on a green leaf"
                fill
                loading="eager"
                sizes="(max-width: 1023px) 100vw, 42vw"
                className="h-full w-full object-cover"
                decoding="async"
                src="/images/festival-earrings.jpg"
              />
            </div>
            <div className="rounded-card from-rose/50 to-gold/20 shadow-soft mt-8 flex aspect-[4/5] items-end overflow-hidden bg-gradient-to-br via-[#e6d7c4] p-5 lg:mt-14">
              <div>
                <p className="font-display text-plum text-2xl">A little extra</p>
                <p className="text-plum/70 mt-1 text-xs">for your everyday.</p>
              </div>
            </div>
          </div>
        </section>

        <Section id="tokens" eyebrow="01 — Foundations" title="A palette with purpose">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Warm ivory", "#FBF7EE", "Background"],
              ["Deep plum", "#4A1F3D", "Primary & headings"],
              ["Antique gold", "#B8860B", "Accents & actions"],
              ["Blush rose", "#E8B4B8", "Highlights"],
              ["Success", "#2E7D5B", "Confirmation"],
              ["Error", "#C0392B", "Errors & urgency"],
            ].map(([name, hex, usage]) => (
              <div
                key={name}
                className="rounded-card border-border shadow-card dark:bg-ink flex items-center gap-4 border bg-white p-3.5"
              >
                <span
                  aria-hidden="true"
                  className="rounded-control size-14 shrink-0 shadow-inner"
                  style={{ backgroundColor: hex }}
                />
                <span>
                  <span className="text-plum block text-sm font-semibold">{name}</span>
                  <span className="text-muted mt-0.5 block text-xs">
                    {hex} · {usage}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-card border-border dark:bg-ink mt-6 grid gap-6 border bg-white p-5 sm:grid-cols-2 sm:p-7">
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-widest">
                Display · Playfair Display
              </p>
              <p className="font-display text-plum mt-3 text-4xl leading-tight">
                Jewellery with a story.
              </p>
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-widest">
                Interface · Inter
              </p>
              <p className="text-muted mt-3 text-sm leading-7">
                Designed for clarity across product details, checkout, and every
                small-screen moment. Spacing follows an 8px rhythm.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="components"
          eyebrow="02 — Components"
          title="The details that delight"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-card border-border dark:bg-ink space-y-6 border bg-white p-5 sm:p-7">
              <div>
                <h3 className="text-plum mb-3 text-sm font-semibold">Buttons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>Shop the edit</Button>
                  <Button variant="secondary">Discover more</Button>
                  <Button variant="ghost">Maybe later</Button>
                </div>
              </div>
              <div>
                <h3 className="text-plum mb-3 text-sm font-semibold">Forms</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    aria-label="Email address"
                    placeholder="Email address"
                    type="email"
                  />
                  <Select aria-label="Choose occasion" defaultValue="">
                    <option disabled value="">
                      Choose occasion
                    </option>
                    <option>Wedding guest</option>
                    <option>Festive</option>
                    <option>Everyday</option>
                  </Select>
                </div>
              </div>
              <div>
                <h3 className="text-plum mb-3 text-sm font-semibold">Chips & badges</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip>Bridal</Chip>
                  <Chip className="border-gold/25 bg-gold/10">Kundan</Chip>
                  <Badge tone="new">New</Badge>
                  <Badge tone="bestseller">Bestseller</Badge>
                  <Badge tone="low-stock">Only 2 left</Badge>
                  <Badge tone="success">In stock</Badge>
                </div>
              </div>
              <div>
                <h3 className="text-plum mb-3 text-sm font-semibold">Loading state</h3>
                <div className="flex gap-3">
                  <Skeleton className="size-14 rounded-full" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-card border-border dark:bg-ink space-y-6 border bg-white p-5 sm:p-7">
              <div>
                <h3 className="text-plum mb-3 text-sm font-semibold">Tabs</h3>
                <Tabs
                  label="Product details"
                  tabs={[
                    {
                      label: "Details",
                      content:
                        "Hand-finished with a luminous gold-tone plating and hand-set Kundan-inspired stones.",
                    },
                    {
                      label: "Shipping",
                      content:
                        "Complimentary shipping across India. International delivery options are available at checkout.",
                    },
                    {
                      label: "Care",
                      content:
                        "Store in a cool, dry place and keep away from perfume, water, and household chemicals.",
                    },
                  ]}
                />
              </div>
              <div>
                <h3 className="text-plum mb-3 text-sm font-semibold">Accordion</h3>
                <Accordion
                  items={[
                    {
                      title: "Is this jewellery suitable for sensitive skin?",
                      content:
                        "Pieces are made with carefully selected base metals. If you have known sensitivities, check the material details on each product page before ordering.",
                    },
                    {
                      title: "How should I care for my piece?",
                      content:
                        "Keep each piece dry, wipe gently after wearing, and store it in its pouch.",
                    },
                  ]}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setModalOpen(true)} variant="secondary">
                  Open modal
                </Button>
                <Button onClick={() => setDrawerOpen(true)} variant="secondary">
                  Open drawer
                </Button>
                <Button onClick={() => toast("Your piece has been added to your bag.")}>
                  Show toast
                </Button>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="product-cards"
          eyebrow="03 — Merchandising"
          title="A little love at first scroll"
        >
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            initial={reduceMotion ? false : "hidden"}
            whileInView={reduceMotion ? undefined : "visible"}
            viewport={{ once: true, amount: 0.12 }}
            variants={stagger}
          >
            {products.map((product) => (
              <motion.div key={product.name} variants={fadeUp}>
                <ProductCard
                  {...product}
                  cartTargetRef={cartTargetRef}
                  onAddToCart={() => addToCart(product.name)}
                  onQuickView={() => setModalOpen(true)}
                />
              </motion.div>
            ))}
          </motion.div>
          <p className="text-muted mt-4 text-xs">
            Product imagery loads lazily with a soft placeholder; hover or focus a card to
            preview the alternate view.
          </p>
        </Section>

        <Section id="motion" eyebrow="04 — Motion & trust" title="Quietly full of life">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-card border-border dark:bg-ink border bg-white p-5 sm:p-7">
              <h3 className="text-plum text-sm font-semibold">Trust, at a glance</h3>
              <div className="mt-6 grid grid-cols-2 gap-5">
                {trustItems.map(({ Icon, label }) => (
                  <div className="flex items-center gap-3" key={label}>
                    <AnimatedIcon className="text-gold" icon={Icon} label={label} />
                    <span className="text-plum text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-control bg-ivory mt-7 flex items-center gap-3 p-3 dark:bg-white/5">
                <span className="bg-success/10 text-success grid size-10 place-items-center rounded-full">
                  <ShieldCheck aria-hidden="true" className="size-5" />
                </span>
                <span className="text-muted text-xs leading-5">
                  Secure checkout, trusted payments, and care at every step.
                </span>
              </div>
            </div>
            <div className="rounded-card border-border dark:bg-ink border bg-white p-5 sm:p-7">
              <h3 className="text-plum text-sm font-semibold">Micro-interactions</h3>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button aria-label="Search jewellery" size="icon" variant="secondary">
                  <Search aria-hidden="true" className="size-4" />
                </Button>
                <Button aria-label="View wishlist" size="icon" variant="secondary">
                  <Heart aria-hidden="true" className="size-4" />
                </Button>
                <Button aria-label="View shopping bag" size="icon" variant="secondary">
                  <ShoppingBag aria-hidden="true" className="size-4" />
                </Button>
                <span className="rounded-control bg-gold/10 text-plum inline-flex items-center gap-2 px-3 text-xs font-semibold">
                  <Sparkles aria-hidden="true" className="text-gold size-4" /> Gold
                  shimmer
                </span>
              </div>
              <div className="rounded-control border-border bg-ivory mt-6 border p-4 dark:bg-white/5">
                <p className="text-plum text-xs font-semibold">Motion guidelines</p>
                <p className="text-muted mt-2 text-xs leading-5">
                  Functional motion stays under 400ms, uses opacity and transforms, and is
                  reduced when a shopper prefers reduced motion.
                </p>
              </div>
              <div className="rounded-control bg-ivory mt-6 grid grid-cols-3 gap-2 p-3 dark:bg-white/5">
                <LottieIllustration kind="success" label="Order placed" />
                <LottieIllustration kind="empty-cart" label="Empty bag" />
                <LottieIllustration kind="empty-search" label="No results" />
              </div>
            </div>
          </div>
        </Section>

        <footer className="border-border text-muted flex flex-col gap-3 border-t py-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-plum text-lg">
            Shringaar<span className="text-gold">.</span>
          </span>
          <span>Made for your moments, with a little more meaning.</span>
          <a
            className="text-plum hover:text-gold inline-flex items-center gap-1 font-medium"
            href="#top"
          >
            Back to top <ArrowRight aria-hidden="true" className="size-3 -rotate-45" />
          </a>
        </footer>
      </div>

      <Modal
        description="A closer look at the craft, colour, and little details."
        onOpenChange={setModalOpen}
        open={modalOpen}
        title="A closer look"
      >
        <div className="rounded-control bg-ivory p-5 dark:bg-white/5">
          <p className="font-display text-plum text-xl">Made to be treasured.</p>
          <p className="text-muted mt-2 text-sm leading-6">
            Thoughtfully finished, ready to gift, and made to bring a little sparkle to
            every occasion.
          </p>
        </div>
        <Button
          className="mt-5 w-full"
          onClick={() => {
            setModalOpen(false);
            addToCart("Your piece");
          }}
        >
          <ShoppingBag aria-hidden="true" className="size-4" /> Add to bag
        </Button>
      </Modal>

      <Drawer onOpenChange={setCartOpen} open={cartOpen} title="Your bag">
        {cartCount === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-5">
            <LottieIllustration
              kind="empty-cart"
              label="Your bag is waiting for something lovely"
            />
            <Button
              onClick={() => {
                setCartOpen(false);
                document
                  .getElementById("product-cards")
                  ?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth" });
              }}
            >
              Explore jewellery
            </Button>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="rounded-control border-border dark:bg-ink flex items-center gap-4 border bg-white p-4">
              <span className="rounded-control bg-rose/20 text-plum grid size-12 shrink-0 place-items-center">
                <ShoppingBag aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-plum text-sm font-semibold">
                  {cartCount} {cartCount === 1 ? "piece" : "pieces"} for your moments
                </p>
                <p className="text-muted mt-1 text-xs">
                  Your selection is ready to review.
                </p>
              </div>
            </div>
            <Button
              className="mt-auto w-full"
              onClick={() => toast("Checkout preview is ready to connect to your store.")}
            >
              Continue to checkout <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        )}
      </Drawer>

      <Drawer onOpenChange={setDrawerOpen} open={drawerOpen} title="Your menu">
        <nav aria-label="Mobile navigation" className="flex flex-col">
          {["New arrivals", "Earrings", "Necklaces", "Bridal edit", "Occasions"].map(
            (item) => (
              <a
                className="border-border text-plum border-b py-4 text-sm font-medium"
                href="#product-cards"
                key={item}
                onClick={() => setDrawerOpen(false)}
              >
                {item}
              </a>
            ),
          )}
        </nav>
      </Drawer>
    </motion.main>
  );
}
