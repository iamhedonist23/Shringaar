import assert from "node:assert/strict";
import test from "node:test";
import {
  cartLinesSchema,
  checkoutRequestSchema,
  idempotencyKeySchema,
} from "../lib/cart-schemas";
import {
  calculateOrderTotals,
  calculateShippingPaise,
  paiseToRupees,
} from "../lib/commerce-pricing";
import {
  canAdminTransitionOrder,
} from "../lib/admin-order-transitions";
import {
  updateAdminProductSchema,
  orderStatusUpdateSchema,
} from "../lib/admin-schemas";

test("shipping is ₹99 through ₹499 and free above that threshold", () => {
  assert.equal(calculateShippingPaise(49_899), 9_900);
  assert.equal(calculateShippingPaise(49_900), 9_900);
  assert.equal(calculateShippingPaise(49_901), 0);
  assert.equal(calculateShippingPaise(100_000), 0);
});

test("server totals include shipping but no tax or client-supplied discounts", () => {
  const totals = calculateOrderTotals([
    { unitPrice: 199.5, quantity: 1 },
    { unitPrice: 100, quantity: 2 },
  ]);
  assert.deepEqual(totals, {
    subtotalPaise: 39_950,
    shippingPaise: 9_900,
    taxPaise: 0,
    discountPaise: 0,
    totalPaise: 49_850,
  });
  assert.equal(paiseToRupees(totals.totalPaise), "498.50");
  assert.equal(calculateOrderTotals([]).shippingPaise, 0);
});

test("cart lines reject duplicate variants and client-provided prices", () => {
  const line = { productId: "p1", variantId: "v1", quantity: 1 };
  assert.equal(cartLinesSchema.safeParse([line]).success, true);
  assert.equal(
    cartLinesSchema.safeParse([{ ...line, price: 0.01 }]).success,
    false,
  );
  assert.equal(cartLinesSchema.safeParse([line, line]).success, false);
});

test("guest checkout validates Indian contact and address fields", () => {
  const request = {
    paymentMethod: "COD",
    lines: [{ productId: "p1", variantId: "v1", quantity: 1 }],
    customer: { name: "Asha Rao", email: "ASHA@example.com", phone: "9876543210" },
    address: {
      line1: "12 Market Road",
      locality: "Pink City",
      city: "Jaipur",
      state: "Rajasthan",
      postalCode: "302001",
      country: "India",
    },
  };
  const parsed = checkoutRequestSchema.safeParse(request);
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.customer.email, "asha@example.com");
  assert.equal(
    checkoutRequestSchema.safeParse({
      ...request,
      address: { ...request.address, postalCode: "1234" },
    }).success,
    false,
  );
  assert.equal(
    checkoutRequestSchema.safeParse({
      ...request,
      total: 0,
    }).success,
    false,
  );
  assert.equal(
    checkoutRequestSchema.safeParse({
      ...request,
      paymentMethod: "PAYTM",
    }).success,
    false,
  );
  assert.equal(idempotencyKeySchema.safeParse("78f3f78f-45c9-47c3-8cb4-8ed663c52ac5").success, true);
  assert.equal(idempotencyKeySchema.safeParse("not-a-uuid").success, false);
});

test("admin product updates use an allowlist and order transitions are explicit", () => {
  assert.equal(
    updateAdminProductSchema.safeParse({ active: false }).success,
    true,
  );
  assert.equal(
    updateAdminProductSchema.safeParse({ active: false, role: "ADMIN" }).success,
    false,
  );
  assert.equal(orderStatusUpdateSchema.safeParse({ status: "PAID" }).success, false);
  assert.equal(canAdminTransitionOrder("CONFIRMED", "PROCESSING"), true);
  assert.equal(canAdminTransitionOrder("DELIVERED", "PROCESSING"), false);
  assert.equal(canAdminTransitionOrder("CANCELLED", "CANCELLED"), false);
});
