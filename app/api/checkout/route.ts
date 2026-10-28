import { NextResponse } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api-response";
import {
  CheckoutConflictError,
  createGuestOrder,
  PaymentMethodUnavailableError,
} from "@/lib/cart-service";
import { checkoutRequestSchema } from "@/lib/cart-schemas";
import { idempotencyKeySchema } from "@/lib/cart-schemas";
import { isSameOriginRequest } from "@/lib/admin-auth";
import { createUroPayCheckout } from "@/lib/uropay-payments";
import { UroPayError } from "@/lib/uropay-client";
import { ensureCustomerProfile, getCustomerSession } from "@/lib/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  let session: Awaited<ReturnType<typeof getCustomerSession>>;
  try {
    session = await getCustomerSession(request.headers);
  } catch (error) {
    return apiError(error);
  }
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to your Shringaar account before placing an order.", redirectTo: "/login?returnTo=%2Fcheckout" },
      { status: 401 },
    );
  }
  const parsedIdempotencyKey = idempotencyKeySchema.safeParse(
    request.headers.get("Idempotency-Key"),
  );
  if (!parsedIdempotencyKey.success) {
    return NextResponse.json(
      { error: "A valid Idempotency-Key header is required." },
      { status: 400 },
    );
  }
  const { data, response } = await readJson(request);
  if (response) return response;
  const parsed = checkoutRequestSchema.safeParse(data);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const customer = await ensureCustomerProfile(session.user);
    const order = await createGuestOrder(
      parsed.data,
      parsedIdempotencyKey.data,
      customer.id,
    );
    if (parsed.data.paymentMethod === "UROPAY") {
      if (!parsed.data.paymentStatusToken) {
        return NextResponse.json(
          { error: "A valid UroPay payment status token is required." },
          { status: 400 },
        );
      }
      const checkout = await createUroPayCheckout(
        order.id,
        parsed.data.paymentStatusToken,
      );
      return NextResponse.json(
        { ...order, ...(checkout.checkoutUrl ? { checkoutUrl: checkout.checkoutUrl } : {}) },
        { status: 201 },
      );
    }
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof PaymentMethodUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof UroPayError) {
      console.error("UroPay checkout initialization failed.");
      return NextResponse.json(
        { error: "Online payment could not be started. Your order was not confirmed; retry checkout." },
        { status: 502 },
      );
    }
    return apiError(error);
  }
}
