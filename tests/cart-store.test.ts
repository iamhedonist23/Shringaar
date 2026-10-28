import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCartLines, useCartStore } from "../lib/cart-store";

test("cart stores only product/variant IDs and quantity", () => {
  useCartStore.getState().clear();
  assert.deepEqual(
    useCartStore.getState().addItem(
      { productId: "product-1", variantId: "variant-1" },
      2,
    ),
    {
      status: "added",
      quantity: 2,
    },
  );
  assert.deepEqual(useCartStore.getState().lines, [
    { productId: "product-1", variantId: "variant-1", quantity: 2 },
  ]);
  assert.deepEqual(
    useCartStore.getState().addItem(
      { productId: "product-1", variantId: "variant-1" },
      98,
    ),
    {
      status: "limit",
      quantity: 99,
    },
  );
  assert.equal(
    useCartStore.getState().getQuantity("product-1", "variant-1"),
    2,
  );
  useCartStore.getState().updateQuantity("product-1", "variant-1", 4);
  assert.equal(
    useCartStore.getState().getQuantity("product-1", "variant-1"),
    4,
  );
  useCartStore.getState().removeItem("product-1", "variant-1");
  assert.deepEqual(useCartStore.getState().lines, []);
  assert.deepEqual(normalizeCartLines([
    {
      productId: "p1",
      variantId: "v1",
      quantity: 3,
      price: 1,
      productName: "Untrusted",
    },
    { productId: "p2", variantId: "v2", quantity: 0 },
    { productId: "p1", variantId: "v1", quantity: 2 },
  ]), [
    { productId: "p1", variantId: "v1", quantity: 2 },
  ]);
  useCartStore.getState().clear();
});
