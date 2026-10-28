"use client";

import type { CartQuoteResponse } from "@/lib/cart-schemas";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function CartOrderSummary({
  quote,
  isLoading,
  error,
}: {
  quote: CartQuoteResponse | null;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <section
      aria-labelledby="order-summary-heading"
      className="rounded-card border border-border bg-white p-5 shadow-card sm:p-6"
    >
      <h2 className="font-display text-2xl text-plum" id="order-summary-heading">
        Order summary
      </h2>
      {error && (
        <p className="mt-4 rounded-control bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      {isLoading && (
        <p className="mt-4 text-sm text-muted" role="status">
          Checking current prices and availability…
        </p>
      )}
      {quote && (
        <>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-plum">{currency.format(Number(quote.subtotal))}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Shipping</dt>
              <dd className="font-medium text-plum">
                {Number(quote.shipping) === 0 ? "Free" : currency.format(Number(quote.shipping))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tax</dt>
              <dd className="font-medium text-plum">Not calculated</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-4 text-base">
              <dt className="font-semibold text-plum">Total</dt>
              <dd className="font-semibold text-plum">{currency.format(Number(quote.total))}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-muted">
            Shipping is ₹99 on orders of ₹499 or less and free above ₹499. GST is not
            calculated at checkout in this release.
          </p>
        </>
      )}
      {!quote && !isLoading && !error && (
        <p className="mt-4 text-sm text-muted">Your order total will appear here.</p>
      )}
    </section>
  );
}
