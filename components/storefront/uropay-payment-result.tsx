"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { uroPayPaymentStatusSchema } from "@/lib/cart-schemas";
import type { z } from "zod";

type PaymentCheck = z.infer<typeof uroPayPaymentStatusSchema>;

export function UroPayPaymentResult({ token }: { token: string | null }) {
  const clearCart = useCartStore((state) => state.clear);
  const [result, setResult] = useState<PaymentCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const checkPayment = useCallback(async () => {
    if (!token) return;
    setChecking(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/payments/uropay/status?token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : "Payment status could not be checked.";
        throw new Error(message);
      }
      const parsed = uroPayPaymentStatusSchema.safeParse(body);
      if (!parsed.success) {
        throw new Error("The payment status response was invalid.");
      }
      const checked = parsed.data;
      setResult(checked);
      if (checked.paymentStatus === "PAID") clearCart();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment status could not be checked.");
    } finally {
      setChecking(false);
    }
  }, [clearCart, token]);

  useEffect(() => {
    window.history.replaceState(window.history.state, "", "/checkout/payment-result");
    // The initial status lookup synchronizes the return URL with provider state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkPayment();
  }, [checkPayment]);

  const statusText = result?.paymentStatus === "PAID"
    ? "Payment received"
    : result?.paymentStatus === "FAILED"
      ? "Payment was not completed"
      : result?.paymentStatus === "REFUNDED"
        ? "Payment refunded"
        : "Payment is pending";

  return (
    <section className="mx-auto my-12 max-w-2xl rounded-card border border-border bg-white p-6 text-center shadow-card sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-contrast">UroPay payment status</p>
      <h1 className="font-display mt-3 text-4xl text-plum">
        {result ? statusText : checking ? "Checking your payment…" : "Check your payment"}
      </h1>
      {result && (
        <p className="mt-4 text-sm leading-6 text-muted">
          Order <strong className="text-plum">{result.orderNumber}</strong> · ₹{Number(result.amount).toLocaleString("en-IN")}
          {result.paymentStatus === "PAID" && result.orderStatus === "CONFIRMED"
            ? " · Your order is confirmed."
            : null}
          {result.inventoryNeedsReview
            ? " · Payment was received, but the order needs a stock review. Please contact support."
            : null}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-error" role="alert">{error}</p>}
      {!token && <p className="mt-4 text-sm text-error" role="alert">Payment status link is missing or invalid.</p>}
      {result?.paymentStatus === "PENDING" && (
        <p className="mt-4 text-sm text-muted">The provider has not confirmed payment yet. This page does not treat the redirect itself as proof of payment.</p>
      )}
      {result?.paymentStatus === "FAILED" && (
        <p className="mt-4 text-sm text-muted">Your bag is unchanged. Return to checkout to try again.</p>
      )}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          className="min-h-11 rounded-control bg-plum px-5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={!token || checking}
          onClick={() => void checkPayment()}
          type="button"
        >
          {checking ? "Checking…" : "Check payment status"}
        </button>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-control border border-border px-5 text-sm font-semibold text-plum" href="/">
          Continue browsing
        </Link>
      </div>
    </section>
  );
}
