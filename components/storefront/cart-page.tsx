"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { CartOrderSummary } from "@/components/storefront/cart-order-summary";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";
import { useCartQuote } from "@/components/storefront/use-cart-quote";
import { hydrateCart, useCartStore } from "@/lib/cart-store";

export function CartPage() {
  const lines = useCartStore((state) => state.lines);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const quoteState = useCartQuote(lines, hasHydrated);

  useEffect(() => {
    void hydrateCart();
  }, []);

  if (!hasHydrated) {
    return (
      <main className="mx-auto min-h-[55vh] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-muted" role="status">Loading your bag…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[55vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-contrast">Your selection</p>
      <h1 className="font-display mt-2 text-4xl text-plum">Shopping bag</h1>
      {lines.length === 0 ? (
        <div className="mt-8 rounded-card border border-border bg-white px-6 py-12 text-center shadow-card">
          <p className="font-display text-2xl text-plum">Your bag is waiting for a little sparkle.</p>
          <p className="mt-2 text-sm text-muted">Explore the collection and add a piece you love.</p>
          <Link className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-gold px-5 text-sm font-semibold text-ink hover:bg-plum hover:text-white" href="/search">
            Explore jewellery
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section aria-label="Items in your bag" className="space-y-4">
            {lines.map((line) => {
              const item = quoteState.quote?.lines.find(
                (candidate) =>
                  candidate.productId === line.productId &&
                  candidate.variantId === line.variantId,
              );
              return (
              <article
                className="grid grid-cols-[88px_1fr] gap-4 rounded-card border border-border bg-white p-4 shadow-card sm:grid-cols-[112px_1fr]"
                key={`${line.productId}-${line.variantId}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-control bg-ivory">
                  <ImageWithFallback
                    alt={item?.productName ?? "Product image"}
                    className="object-cover"
                    sizes="112px"
                    src={item?.imageUrl}
                  />
                </div>
                <div className="min-w-0">
                  {item?.productSlug ? (
                    <Link
                      className="font-medium text-plum underline-offset-4 hover:underline"
                      href={`/products/${item.productSlug}`}
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <p className="font-medium text-plum">
                      {item ? "Unavailable item" : "Checking item details"}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted">
                    {item?.variantName ?? "Product details will load from the catalogue"}
                  </p>
                  {item && item.status !== "available" && (
                    <p className="mt-2 text-sm font-medium text-error" role="status">
                      {item.status === "out-of-stock"
                        ? item.inventoryQuantity === 0
                          ? "Currently out of stock"
                          : `Only ${item.inventoryQuantity} available`
                        : "No longer available"}
                    </p>
                  )}
                  {item?.unitPrice !== null && item?.unitPrice !== undefined && (
                    <p className="mt-2 text-sm font-semibold text-plum">
                      ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {item?.status !== "unavailable" && (
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button
                          aria-label={`Decrease quantity of ${item?.productName ?? "item"}`}
                          className="grid size-10 place-items-center text-plum disabled:opacity-40"
                          disabled={line.quantity <= 1}
                          onClick={() => updateQuantity(line.productId, line.variantId, line.quantity - 1)}
                          type="button"
                        >
                          <Minus aria-hidden="true" className="size-4" />
                        </button>
                        <span aria-label={`Quantity ${line.quantity}`} className="min-w-8 text-center text-sm">
                          {line.quantity}
                        </span>
                        <button
                          aria-label={`Increase quantity of ${item?.productName ?? "item"}`}
                          className="grid size-10 place-items-center text-plum"
                          disabled={line.quantity >= 99}
                          onClick={() => updateQuantity(line.productId, line.variantId, line.quantity + 1)}
                          type="button"
                        >
                          <Plus aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    )}
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-control px-2 text-sm text-error hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      onClick={() => removeItem(line.productId, line.variantId)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
              );
            })}
          </section>
          <div className="space-y-4">
            <CartOrderSummary
              error={quoteState.error}
              isLoading={quoteState.isLoading}
              quote={quoteState.quote}
            />
            <Link
              aria-disabled={!quoteState.quote?.canCheckout || quoteState.isLoading || Boolean(quoteState.error)}
              className={`flex min-h-12 items-center justify-center rounded-control bg-plum px-6 text-sm font-semibold text-white transition hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                !quoteState.quote?.canCheckout || quoteState.isLoading || quoteState.error
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
              href="/checkout"
              tabIndex={!quoteState.quote?.canCheckout || quoteState.isLoading || quoteState.error ? -1 : 0}
            >
              Continue to checkout
            </Link>
            <Link className="block text-center text-sm font-medium text-plum underline underline-offset-4" href="/search">
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
