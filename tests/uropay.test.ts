import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { isUroPayEnabled } from "../lib/commerce-config";
import {
  createUroPaySignature,
  isTrustedUroPayCheckoutUrl,
} from "../lib/uropay-client";
import {
  checkoutRequestSchema,
  checkoutResponseSchema,
  uroPayPaymentStatusSchema,
} from "../lib/cart-schemas";

test("UroPay request signatures match the documented canonical string", () => {
  const input = {
    method: "POST",
    path: "/v1/orders",
    timestamp: "1761400000",
    nonce: "e2918631-83af-49dd-b395-e1d8ea295f5d",
    queryString: "",
    rawBody: '{"tenantOrderRef":"SHR-123","amount":500,"currency":"INR"}',
    secret: "test-only-secret",
  };
  const canonical = [
    input.method,
    input.path,
    input.timestamp,
    input.nonce,
    input.queryString,
    input.rawBody,
  ].join("\n");
  assert.equal(
    createUroPaySignature(input),
    createHmac("sha256", input.secret).update(canonical).digest("hex"),
  );
  assert.equal(
    createUroPaySignature({
      ...input,
      method: "GET",
      path: "/v1/orders/URPY-123",
      rawBody: "",
    }),
    createHmac("sha256", input.secret)
      .update([
        "GET",
        "/v1/orders/URPY-123",
        input.timestamp,
        input.nonce,
        "",
        "",
      ].join("\n"))
      .digest("hex"),
  );
});

test("UroPay hosted checkout URL is restricted to the provider origin", () => {
  assert.equal(isTrustedUroPayCheckoutUrl("https://api.uropai.in/checkout/test"), true);
  assert.equal(isTrustedUroPayCheckoutUrl("http://api.uropai.in/checkout/test"), false);
  assert.equal(isTrustedUroPayCheckoutUrl("https://api.uropai.in.attacker.invalid/pay"), false);
  assert.equal(isTrustedUroPayCheckoutUrl("https://user@api.uropai.in/pay"), false);
});

test("UroPay requires HTTPS and both server-side test credentials", () => {
  const previous = {
    authUrl: process.env.AUTH_URL,
    apiKey: process.env.UROPAY_TEST_API_KEY,
    secret: process.env.UROPAY_TEST_API_SECRET,
    returnUrl: process.env.UROPAY_RETURN_URL,
  };
  try {
    process.env.AUTH_URL = "http://localhost:3000";
    process.env.UROPAY_TEST_API_KEY = "TEST_test-only-key";
    process.env.UROPAY_TEST_API_SECRET = "test-only-secret";
    delete process.env.UROPAY_RETURN_URL;
    assert.equal(isUroPayEnabled(), false);

    process.env.AUTH_URL = "https://shringaar.example";
    assert.equal(isUroPayEnabled(), true);

    delete process.env.UROPAY_TEST_API_SECRET;
    assert.equal(isUroPayEnabled(), false);
  } finally {
    if (previous.authUrl === undefined) delete process.env.AUTH_URL;
    else process.env.AUTH_URL = previous.authUrl;
    if (previous.apiKey === undefined) delete process.env.UROPAY_TEST_API_KEY;
    else process.env.UROPAY_TEST_API_KEY = previous.apiKey;
    if (previous.secret === undefined) delete process.env.UROPAY_TEST_API_SECRET;
    else process.env.UROPAY_TEST_API_SECRET = previous.secret;
    if (previous.returnUrl === undefined) delete process.env.UROPAY_RETURN_URL;
    else process.env.UROPAY_RETURN_URL = previous.returnUrl;
  }
});

test("online checkout requires a status token and never accepts client totals", () => {
  const base = {
    lines: [{ productId: "p1", variantId: "v1", quantity: 1 }],
    customer: { name: "Asha Rao", email: "asha@example.com", phone: "9876543210" },
    address: {
      line1: "12 Market Road",
      locality: "Pink City",
      city: "Jaipur",
      state: "Rajasthan",
      postalCode: "302001",
      country: "India",
    },
  };
  assert.equal(
    checkoutRequestSchema.safeParse({ ...base, paymentMethod: "UROPAY" }).success,
    false,
  );
  assert.equal(
    checkoutRequestSchema.safeParse({
      ...base,
      paymentMethod: "UROPAY",
      paymentStatusToken: "78f3f78f-45c9-47c3-8cb4-8ed663c52ac5",
      total: 1,
    }).success,
    false,
  );
  assert.equal(
    checkoutRequestSchema.safeParse({
      ...base,
      paymentMethod: "UROPAY",
      paymentStatusToken: "78f3f78f-45c9-47c3-8cb4-8ed663c52ac5",
    }).success,
    true,
  );
});

test("checkout payment responses support COD and hosted UroPay without exposing credentials", () => {
  assert.equal(
    checkoutResponseSchema.safeParse({
      id: "order-id",
      orderNumber: "SHR-123",
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "UROPAY",
      total: "500.00",
      checkoutUrl: "https://api.uropai.in/checkout/session",
    }).success,
    true,
  );
  const responseWithSecret = checkoutResponseSchema.parse({
    id: "order-id",
    orderNumber: "SHR-123",
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "UROPAY",
    total: "500.00",
    apiKey: "test-only-key",
  });
  assert.equal("apiKey" in responseWithSecret, false);
});

test("payment status response is allowlisted", () => {
  assert.equal(
    uroPayPaymentStatusSchema.safeParse({
      orderNumber: "SHR-123",
      amount: "500.00",
      providerStatus: "PAID",
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
      inventoryNeedsReview: false,
    }).success,
    true,
  );
  const statusWithSecret = uroPayPaymentStatusSchema.parse({
    orderNumber: "SHR-123",
    amount: "500.00",
    providerStatus: "PAID",
    paymentStatus: "PAID",
    orderStatus: "CONFIRMED",
    inventoryNeedsReview: false,
    apiKey: "secret",
  });
  assert.equal("apiKey" in statusWithSecret, false);
});
