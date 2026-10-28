import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  CheckoutConflictError,
  createCartQuote,
  createGuestOrder,
} from "../lib/cart-service";
import { checkoutRequestSchema } from "../lib/cart-schemas";
import { getFirestoreDb } from "../lib/firebase/firestore";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim()
  ?? "demo-shringaar-test";

if (emulatorHost) {
  if (!/^(localhost|127\.0\.0\.1):\d+$/.test(emulatorHost)) {
    throw new Error(
      "Checkout integration tests require FIRESTORE_EMULATOR_HOST to point to localhost.",
    );
  }
  process.env.FIREBASE_ADMIN_PROJECT_ID = projectId;
}

test(
  "Firestore catalog quote and checkout reserve inventory and preserve idempotent retries",
  { skip: !emulatorHost && "Set FIRESTORE_EMULATOR_HOST to run Firestore integration coverage." },
  async () => {
    const db = getFirestoreDb();
    const suffix = randomUUID().replaceAll("-", "");
    const productId = `qa-${suffix}`;
    const variantId = `variant-${suffix}`;
    const idempotencyKey = randomUUID();
    const failedIdempotencyKey = randomUUID();
    const previousCodSetting = process.env.COD_ENABLED;
    process.env.COD_ENABLED = "true";

    try {
      await db.collection("products").doc(productId).set({
        id: productId,
        name: `Integration Test Jhumka ${suffix}`,
        slug: `integration-test-jhumka-${suffix}`,
        description: "Firestore checkout integration fixture.",
        shortDescription: null,
        categoryId: "qa-category",
        material: "Brass",
        plating: "Antique Gold",
        stoneType: "Kundan",
        occasions: ["Festive"],
        specifications: null,
        imageUrls: ["/images/festival-earrings.jpg"],
        seoTitle: null,
        seoDescription: null,
        active: true,
        featured: false,
        collectionIds: [],
        variants: [{
          id: variantId,
          productId,
          sku: `QA-${suffix}`,
          name: "Antique Gold",
          color: "Gold",
          options: null,
          price: 400,
          compareAtPrice: null,
          inventoryQuantity: 2,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const line = { productId, variantId, quantity: 1 };
      const quote = await createCartQuote([line]);
      assert.equal(quote.canCheckout, true);
      assert.equal(quote.subtotal, "400.00");
      assert.equal(quote.shipping, "99.00");
      assert.equal(quote.total, "499.00");

      const checkout = checkoutRequestSchema.parse({
        paymentMethod: "COD",
        lines: [line],
        customer: {
          name: "Integration Test",
          email: "checkout@example.test",
          phone: "9876543210",
        },
        address: {
          line1: "12 Test Market Road",
          locality: "Test Area",
          city: "Jaipur",
          state: "Rajasthan",
          postalCode: "302001",
          country: "India",
        },
      });

      const firstOrder = await createGuestOrder(checkout, idempotencyKey);
      assert.equal(firstOrder.status, "CONFIRMED");
      assert.equal(firstOrder.paymentStatus, "PENDING");
      assert.equal(firstOrder.paymentMethod, "COD");
      assert.equal(firstOrder.total, "499.00");

      const retryOrder = await createGuestOrder(checkout, idempotencyKey);
      assert.equal(retryOrder.id, firstOrder.id);
      const persistedOrder = await db.collection("orders").doc(firstOrder.id).get();
      assert.equal(persistedOrder.get("items").length, 1);
      assert.equal(persistedOrder.get("items")[0].unitPrice, 400);
      assert.equal(persistedOrder.get("payments").length, 1);

      const product = await db.collection("products").doc(productId).get();
      assert.equal(product.get("variants")[0].inventoryQuantity, 1);

      const tooMany = checkoutRequestSchema.parse({
        ...checkout,
        lines: [{ ...line, quantity: 2 }],
      });
      await assert.rejects(
        createGuestOrder(tooMany, failedIdempotencyKey),
        CheckoutConflictError,
      );
      assert.equal(
        (await db.collection("products").doc(productId).get())
          .get("variants")[0].inventoryQuantity,
        1,
      );

      await assert.rejects(
        createGuestOrder(
          {
            ...checkout,
            customer: { ...checkout.customer, name: "Different Checkout" },
          },
          idempotencyKey,
        ),
        CheckoutConflictError,
      );
    } finally {
      await Promise.all([
        db.collection("products").doc(productId).delete(),
        db.collection("orders").doc(idempotencyKey).delete(),
        db.collection("orderIdempotencyKeys").doc(idempotencyKey).delete(),
        db.collection("orders").doc(failedIdempotencyKey).delete(),
        db.collection("orderIdempotencyKeys").doc(failedIdempotencyKey).delete(),
      ]);
      if (previousCodSetting === undefined) {
        delete process.env.COD_ENABLED;
      } else {
        process.env.COD_ENABLED = previousCodSetting;
      }
    }
  },
);
