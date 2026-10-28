import { createHmac, randomUUID } from "node:crypto";
import { z } from "zod";

const UROPAY_API_URL = "https://api.uropai.in";
const UROPAY_HOSTED_CHECKOUT_HOST = "api.uropai.in";

export function isTrustedUroPayCheckoutUrl(value: string) {
  try {
    const checkoutUrl = new URL(value);
    return (
      checkoutUrl.protocol === "https:" &&
      checkoutUrl.hostname === UROPAY_HOSTED_CHECKOUT_HOST &&
      !checkoutUrl.username &&
      !checkoutUrl.password
    );
  } catch {
    return false;
  }
}

const uropayEnvelopeSchema = z.object({
  status: z.enum(["success", "error"]),
  message: z.string().optional(),
  data: z.object({
    id: z.string().min(1).max(200),
    tenantOrderRef: z.string().min(1).max(200),
    status: z.enum([
      "PENDING",
      "PAID",
      "FAILED",
      "EXPIRED",
      "CANCELLED",
      "REFUNDED",
    ]),
    amount: z.number().finite().nonnegative(),
    currency: z.string().length(3),
    openUrl: z.url().optional(),
  }),
});

export type UroPayOrder = z.infer<typeof uropayEnvelopeSchema>["data"];

export class UroPayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UroPayError";
  }
}

export function createUroPaySignature(input: {
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  queryString: string;
  rawBody: string;
  secret: string;
}) {
  const canonical = [
    input.method,
    input.path,
    input.timestamp,
    input.nonce,
    input.queryString,
    input.rawBody,
  ].join("\n");
  return createHmac("sha256", input.secret).update(canonical).digest("hex");
}

function getCredentials() {
  const apiKey = process.env.UROPAY_TEST_API_KEY?.trim();
  const secret = process.env.UROPAY_TEST_API_SECRET?.trim();
  if (!apiKey?.startsWith("TEST_") || !secret) {
    throw new UroPayError("UroPay test credentials are not configured.");
  }
  return { apiKey, secret };
}

function signRequest(method: string, path: string, body: string) {
  const { apiKey, secret } = getCredentials();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomUUID();
  const signature = createUroPaySignature({
    method,
    path,
    timestamp,
    nonce,
    queryString: "",
    rawBody: body,
    secret,
  });
  return {
    "X-Api-Key": apiKey,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Signature": signature,
  };
}

async function requestOrder(
  path: string,
  method: "GET" | "POST",
  body = "",
  origin?: string,
) {
  let response: Response;
  try {
    response = await fetch(`${UROPAY_API_URL}${path}`, {
      method,
      headers: {
        ...signRequest(method, path, body),
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        ...(method === "POST" && origin ? { Origin: origin } : {}),
      },
      ...(method === "POST" ? { body } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new UroPayError("Could not connect to UroPay. Please try again.");
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new UroPayError("UroPay returned an unreadable response.");
  }
  const parsed = uropayEnvelopeSchema.safeParse(responseBody);
  if (!response.ok || !parsed.success || parsed.data.status !== "success") {
    throw new UroPayError(
      parsed.success
        ? parsed.data.message ?? "UroPay could not process the payment request."
        : "UroPay returned an invalid response.",
    );
  }
  return parsed.data.data;
}

export async function createUroPayOrder(input: {
  tenantOrderRef: string;
  amount: number;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  origin: string;
}) {
  const body = JSON.stringify({
    tenantOrderRef: input.tenantOrderRef,
    amount: input.amount,
    currency: "INR",
    paymentMethods: ["upi"],
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    returnUrl: input.returnUrl,
  });
  const order = await requestOrder("/v1/orders", "POST", body, input.origin);
  if (
    order.tenantOrderRef !== input.tenantOrderRef ||
    order.currency !== "INR" ||
    order.amount !== input.amount
  ) {
    throw new UroPayError("UroPay returned a payment order that does not match this checkout.");
  }
  if (order.openUrl) {
    if (!isTrustedUroPayCheckoutUrl(order.openUrl)) {
      throw new UroPayError("UroPay returned an untrusted checkout URL.");
    }
  }
  return order;
}

export async function getUroPayOrder(orderId: string) {
  return requestOrder(`/v1/orders/${encodeURIComponent(orderId)}`, "GET");
}
