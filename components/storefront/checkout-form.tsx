"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CartOrderSummary } from "@/components/storefront/cart-order-summary";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";
import { Button } from "@/components/ui/button";
import { useCartQuote } from "@/components/storefront/use-cart-quote";
import {
  checkoutFailureSchema,
  checkoutResponseSchema,
} from "@/lib/cart-schemas";
import { hydrateCart, useCartStore } from "@/lib/cart-store";

type CheckoutAddress = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  addressType: "HOME" | "WORK";
  isDefault: boolean;
};

export function CheckoutForm({
  cashOnDeliveryEnabled,
  uroPayEnabled,
  customer,
  addresses,
}: {
  cashOnDeliveryEnabled: boolean;
  uroPayEnabled: boolean;
  customer: { id: string; name: string; email: string; phone: string | null };
  addresses: CheckoutAddress[];
}) {
  const router = useRouter();
  const lines = useCartStore((state) => state.lines);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const clear = useCartStore((state) => state.clear);
  const quoteState = useCartQuote(lines, hasHydrated);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<{
    orderNumber: string;
    total: string;
    paymentStatus: "PENDING";
    paymentMethod: "COD";
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UROPAY">(
    cashOnDeliveryEnabled || !uroPayEnabled ? "COD" : "UROPAY",
  );
  const defaultAddress = addresses.find((address) => address.isDefault) ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? "");
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressType, setAddressType] = useState<"HOME" | "WORK">(
    defaultAddress?.addressType ?? "HOME",
  );
  const [name, setName] = useState(defaultAddress?.fullName ?? customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(defaultAddress?.phone ?? customer?.phone ?? "");
  const [line1, setLine1] = useState(defaultAddress?.addressLine1 ?? "");
  const [line2, setLine2] = useState(defaultAddress?.addressLine2 ?? "");
  const [locality, setLocality] = useState(defaultAddress?.locality ?? "");
  const [city, setCity] = useState(defaultAddress?.city ?? "");
  const [state, setState] = useState(defaultAddress?.state ?? "");
  const [postalCode, setPostalCode] = useState(defaultAddress?.postalCode ?? "");
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    void hydrateCart();
  }, []);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const checkoutCustomer = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
    };
    const address = {
      line1: form.get("line1"),
      line2: form.get("line2") || undefined,
      locality: form.get("locality"),
      city: form.get("city"),
      state: form.get("state"),
      postalCode: form.get("postalCode"),
      country: "India",
    };
    const selectedPaymentMethod = new FormData(event.currentTarget).get("paymentMethod");
    if (selectedPaymentMethod !== "COD" && selectedPaymentMethod !== "UROPAY") {
      setError("Choose an available payment method.");
      return;
    }
    if (
      (selectedPaymentMethod === "COD" && !cashOnDeliveryEnabled) ||
      (selectedPaymentMethod === "UROPAY" && !uroPayEnabled)
    ) {
      setError("That payment method is currently unavailable.");
      return;
    }
    const paymentStatusToken =
      selectedPaymentMethod === "UROPAY"
        ? sessionStorage.getItem("shringaar-checkout-payment-token") ??
          crypto.randomUUID()
        : undefined;
    if (paymentStatusToken) {
      sessionStorage.setItem("shringaar-checkout-payment-token", paymentStatusToken);
    }
    const idempotencyKey =
      idempotencyKeyRef.current ??
      sessionStorage.getItem("shringaar-checkout-idempotency") ??
      crypto.randomUUID();
    idempotencyKeyRef.current = idempotencyKey;
    sessionStorage.setItem("shringaar-checkout-idempotency", idempotencyKey);

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          lines,
          customer: checkoutCustomer,
          address,
          ...(selectedAddressId ? { addressId: selectedAddressId } : {}),
          saveAddress: !selectedAddressId && saveAddress,
          addressType,
          paymentMethod: selectedPaymentMethod,
          ...(paymentStatusToken ? { paymentStatusToken } : {}),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          router.replace(`/login?returnTo=${encodeURIComponent("/checkout")}`);
          return;
        }
        const parsedFailure = checkoutFailureSchema.safeParse(result);
        const failure = parsedFailure.success ? parsedFailure.data : {};
        const issue = failure.issues?.[0];
        if (response.status === 400 || response.status === 409 || response.status === 503) {
          sessionStorage.removeItem("shringaar-checkout-idempotency");
          idempotencyKeyRef.current = null;
        }
        throw new Error(
          issue ? `${issue.path}: ${issue.message}` : failure.error ?? "We couldn't place this order.",
        );
      }
      const parsedOrder = checkoutResponseSchema.safeParse(result);
      if (!parsedOrder.success) {
        throw new Error("The order response was invalid. Contact support before retrying.");
      }
      if (parsedOrder.data.paymentMethod === "UROPAY") {
        if (parsedOrder.data.checkoutUrl) {
          window.location.assign(parsedOrder.data.checkoutUrl);
        } else if (paymentStatusToken) {
          router.push(
            `/checkout/payment-result?token=${encodeURIComponent(paymentStatusToken)}`,
          );
        } else {
          throw new Error("The payment status link is missing. Contact support before retrying.");
        }
        sessionStorage.removeItem("shringaar-checkout-idempotency");
        sessionStorage.removeItem("shringaar-checkout-payment-token");
        idempotencyKeyRef.current = null;
        return;
      }
      setOrder({
        orderNumber: parsedOrder.data.orderNumber,
        total: parsedOrder.data.total,
        paymentStatus: parsedOrder.data.paymentStatus,
        paymentMethod: parsedOrder.data.paymentMethod,
      });
      sessionStorage.removeItem("shringaar-checkout-idempotency");
      sessionStorage.removeItem("shringaar-checkout-payment-token");
      idempotencyKeyRef.current = null;
      clear();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't place this order. Please review your details and try again.",
      );
      quoteState.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasHydrated) {
    return <p className="min-h-[55vh] px-4 py-12 text-sm text-muted" role="status">Loading checkout…</p>;
  }

  if (order) {
    return (
      <section className="mx-auto my-12 max-w-2xl rounded-card border border-border bg-white p-6 text-center shadow-card sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">Order received</p>
        <h1 className="font-display mt-3 text-4xl text-plum">Thank you for your order.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Cash-on-delivery order <strong className="text-plum">{order.orderNumber}</strong> is confirmed.
          Payment status: {order.paymentStatus.toLowerCase()}. Pay ₹{Number(order.total).toLocaleString("en-IN")}
          on delivery. No online payment has been collected.
        </p>
        <Link className="mt-7 inline-flex min-h-11 items-center justify-center rounded-control bg-gold px-5 text-sm font-semibold text-white hover:bg-plum" href="/">
          Continue browsing
        </Link>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto my-12 max-w-2xl rounded-card border border-border bg-white p-8 text-center shadow-card">
        <h1 className="font-display text-3xl text-plum">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted">Add an item before starting checkout.</p>
        <Link className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-gold px-5 text-sm font-semibold text-white hover:bg-plum" href="/search">
          Explore jewellery
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_400px] lg:px-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-contrast">Signed-in checkout</p>
        <h1 className="font-display mt-2 text-4xl text-plum">Delivery details</h1>
        <form className="mt-7 space-y-7" onSubmit={submitOrder}>
          {error && (
            <p className="rounded-control bg-error/10 px-4 py-3 text-sm text-error" role="alert">
              {error}
            </p>
          )}
          {addresses.length > 0 && (
            <label className="block rounded-card border border-border bg-white p-5 text-sm font-medium text-plum shadow-card" htmlFor="saved-address">
              Choose a saved delivery address
              <select
                className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3"
                id="saved-address"
                onChange={(event) => {
                  const id = event.currentTarget.value;
                  setSelectedAddressId(id);
                  const address = addresses.find((item) => item.id === id);
                  if (address) {
                    setName(address.fullName);
                    setPhone(address.phone);
                    setLine1(address.addressLine1);
                    setLine2(address.addressLine2 ?? "");
                    setLocality(address.locality);
                    setCity(address.city);
                    setState(address.state);
                    setPostalCode(address.postalCode);
                    setAddressType(address.addressType);
                    setSaveAddress(false);
                  } else {
                    setName(customer.name);
                    setPhone(customer.phone ?? "");
                    setLine1("");
                    setLine2("");
                    setLocality("");
                    setCity("");
                    setState("");
                    setPostalCode("");
                    setAddressType("HOME");
                  }
                }}
                value={selectedAddressId}
              >
                <option value="">Enter a new address</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.addressType === "HOME" ? "Home" : "Work"} · {address.addressLine1}, {address.city}{address.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <fieldset className="space-y-4 rounded-card border border-border bg-white p-5 shadow-card sm:p-6">
            <legend className="px-2 font-semibold text-plum">Contact information</legend>
            <label className="block text-sm font-medium text-plum" htmlFor="checkout-name">
              Full name
              <input autoComplete="name" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal" id="checkout-name" maxLength={120} name="name" onChange={(event) => { setName(event.currentTarget.value); setSelectedAddressId(""); }} required value={name} />
            </label>
            <label className="block text-sm font-medium text-plum" htmlFor="checkout-email">
              Email
              <input autoComplete="email" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal" id="checkout-email" maxLength={254} name="email" onChange={(event) => setEmail(event.currentTarget.value)} required type="email" value={email} />
            </label>
            <label className="block text-sm font-medium text-plum" htmlFor="checkout-phone">
              Indian mobile number
              <input autoComplete="tel" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal" id="checkout-phone" maxLength={15} name="phone" onChange={(event) => { setPhone(event.currentTarget.value); setSelectedAddressId(""); }} placeholder="9876543210" required type="tel" value={phone} />
            </label>
          </fieldset>
          <fieldset className="grid gap-4 rounded-card border border-border bg-white p-5 shadow-card sm:grid-cols-2 sm:p-6">
            <legend className="px-2 font-semibold text-plum">Delivery address in India</legend>
            <label className="block text-sm font-medium text-plum sm:col-span-2" htmlFor="checkout-line1">
              Address
              <input autoComplete="address-line1" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal" id="checkout-line1" maxLength={200} name="line1" onChange={(event) => { setLine1(event.currentTarget.value); setSelectedAddressId(""); }} required value={line1} />
            </label>
            <label className="block text-sm font-medium text-plum sm:col-span-2" htmlFor="checkout-line2">
              Apartment, suite, landmark (optional)
              <input autoComplete="address-line2" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal" id="checkout-line2" maxLength={200} name="line2" onChange={(event) => { setLine2(event.currentTarget.value); setSelectedAddressId(""); }} value={line2} />
            </label>
            <label className="block text-sm font-medium text-plum sm:col-span-2" htmlFor="checkout-locality">
              Locality / area
              <input autoComplete="address-level3" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal" id="checkout-locality" maxLength={120} name="locality" onChange={(event) => { setLocality(event.currentTarget.value); setSelectedAddressId(""); }} required value={locality} />
            </label>
            <label className="block text-sm font-medium text-plum" htmlFor="checkout-city">
              City
              <input autoComplete="address-level2" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal" id="checkout-city" maxLength={100} name="city" onChange={(event) => { setCity(event.currentTarget.value); setSelectedAddressId(""); }} required value={city} />
            </label>
            <label className="block text-sm font-medium text-plum" htmlFor="checkout-state">
              State
              <input autoComplete="address-level1" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal" id="checkout-state" maxLength={100} name="state" onChange={(event) => { setState(event.currentTarget.value); setSelectedAddressId(""); }} required value={state} />
            </label>
            <label className="block text-sm font-medium text-plum sm:col-span-2" htmlFor="checkout-postal">
              PIN code
              <input autoComplete="postal-code" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal" id="checkout-postal" inputMode="numeric" maxLength={6} name="postalCode" onChange={(event) => { setPostalCode(event.currentTarget.value); setSelectedAddressId(""); }} pattern="[0-9]{6}" required value={postalCode} />
            </label>
            {!selectedAddressId && (
              <>
                <label className="block text-sm font-medium text-plum" htmlFor="checkout-address-type">
                  Save as
                  <select className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3" id="checkout-address-type" onChange={(event) => setAddressType(event.currentTarget.value as "HOME" | "WORK")} value={addressType}>
                    <option value="HOME">Home</option>
                    <option value="WORK">Work</option>
                  </select>
                </label>
                <label className="flex min-h-11 items-center gap-3 text-sm text-plum">
                  <input checked={saveAddress} onChange={(event) => setSaveAddress(event.currentTarget.checked)} type="checkbox" />
                  Save this address to my account
                </label>
              </>
            )}
          </fieldset>
          <fieldset className="space-y-3 rounded-card border border-border bg-white p-5 shadow-card sm:p-6">
            <legend className="px-2 font-semibold text-plum">Payment method</legend>
            <label className={`flex min-h-12 items-center gap-3 text-sm ${cashOnDeliveryEnabled ? "font-medium text-plum" : "text-muted"}`}>
              <input
                defaultChecked={cashOnDeliveryEnabled || !uroPayEnabled}
                disabled={!cashOnDeliveryEnabled}
                name="paymentMethod"
                required
                onChange={() => setPaymentMethod("COD")}
                type="radio"
                value="COD"
              />
              Cash on delivery
            </label>
            <label className={`flex min-h-12 items-center gap-3 text-sm ${uroPayEnabled ? "font-medium text-plum" : "text-muted"}`}>
              <input
                defaultChecked={!cashOnDeliveryEnabled && uroPayEnabled}
                disabled={!uroPayEnabled}
                name="paymentMethod"
                onChange={() => setPaymentMethod("UROPAY")}
                type="radio"
                value="UROPAY"
              />
              UroPay secure UPI checkout{!uroPayEnabled ? " (not configured)" : ""}
            </label>
            <p className="text-xs leading-5 text-muted">
              {paymentMethod === "UROPAY"
                ? "You will continue to UroPay’s hosted UPI page. Payment is confirmed only after our server verifies the provider’s order status."
                : cashOnDeliveryEnabled
                  ? "Pay on delivery. Your order will be confirmed with payment pending."
                  : "Neither payment method is currently available."}
            </p>
          </fieldset>
          <Button className="w-full sm:w-auto" disabled={(!cashOnDeliveryEnabled && !uroPayEnabled) || submitting || !quoteState.quote?.canCheckout || quoteState.isLoading || Boolean(quoteState.error)} size="lg" type="submit">
            {submitting
              ? "Starting checkout…"
              : paymentMethod === "UROPAY"
                ? "Continue to UroPay"
                : "Confirm cash-on-delivery order"}
          </Button>
          <p className="text-xs leading-5 text-muted">
            {paymentMethod === "COD"
              ? "Your order will be confirmed for cash on delivery. Payment remains pending until it is collected."
              : "Your order remains pending until UroPay confirms the payment. The redirect itself does not confirm payment."}
          </p>
        </form>
      </section>
      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <CartOrderSummary error={quoteState.error} isLoading={quoteState.isLoading} quote={quoteState.quote} />
        <section aria-label="Items to be ordered" className="space-y-3">
          {quoteState.quote?.lines.map((item) => (
            <article className="flex gap-3 rounded-card border border-border bg-white p-3" key={`${item.productId}-${item.variantId}`}>
              <div className="relative size-16 shrink-0 overflow-hidden rounded-control bg-ivory">
                <ImageWithFallback alt={item.productName ?? "Product image"} className="object-cover" sizes="64px" src={item.imageUrl} />
              </div>
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium text-plum">{item.productName ?? "Unavailable item"}</p>
                <p className="text-muted">{item.variantName ?? "Option unavailable"} · Qty {item.quantity}</p>
                {item.status !== "available" && (
                  <p className="text-error">{item.status === "out-of-stock" ? "Insufficient stock" : "Unavailable"}</p>
                )}
              </div>
            </article>
          ))}
        </section>
        <Link className="block text-center text-sm font-medium text-plum underline underline-offset-4" href="/cart">
          Return to bag
        </Link>
      </aside>
    </div>
  );
}
