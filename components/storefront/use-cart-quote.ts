"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cartQuoteResponseSchema,
  type CartQuoteResponse,
} from "@/lib/cart-schemas";
import type { CartLine } from "@/lib/cart-store";

export function useCartQuote(lines: CartLine[], hasHydrated: boolean) {
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (lines.length === 0) return;

    const controller = new AbortController();
    // Expose the pending network state before requesting authoritative cart data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result: unknown = await response.json();
        const parsed = cartQuoteResponseSchema.safeParse(result);
        if (!response.ok || !parsed.success) {
          throw new Error("Your current prices and stock could not be confirmed.");
        }
        setQuote(parsed.data);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Your current prices and stock could not be confirmed.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [hasHydrated, lines, refreshKey]);

  const emptyCart = hasHydrated && lines.length === 0;
  return {
    quote: emptyCart ? null : quote,
    isLoading: emptyCart ? false : isLoading,
    error: emptyCart ? null : error,
    refresh,
  };
}
