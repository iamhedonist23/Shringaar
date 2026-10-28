import assert from "node:assert/strict";
import test from "node:test";
import {
  adminFulfillmentUpdateSchema,
  adminPageQuerySchema,
} from "../lib/admin-schemas";
import { canAdminTransitionOrder } from "../lib/admin-order-transitions";
import {
  canEditShippingAddress,
  canTransitionShipment,
} from "../lib/admin-shipment";

test("manual shipment workflow allows only declared next stages", () => {
  assert.equal(canTransitionShipment("PENDING", "PACKING"), true);
  assert.equal(canTransitionShipment("READY_TO_SHIP", "SHIPPED"), true);
  assert.equal(canTransitionShipment("IN_TRANSIT", "DELIVERED"), true);
  assert.equal(canTransitionShipment("PENDING", "DELIVERED"), false);
  assert.equal(canTransitionShipment("RETURNED", "IN_TRANSIT"), false);
  assert.equal(canTransitionShipment("PACKING", "CANCELLED"), false);
});

test("shipping address can only be edited before dispatch", () => {
  assert.equal(canEditShippingAddress("PENDING"), true);
  assert.equal(canEditShippingAddress("READY_TO_SHIP"), true);
  assert.equal(canEditShippingAddress("SHIPPED"), false);
  assert.equal(canEditShippingAddress("DELIVERED"), false);
});

test("fulfilment updates validate fields and reject mass assignment", () => {
  assert.equal(
    adminFulfillmentUpdateSchema.safeParse({
      shipmentStatus: "PACKING",
      trackingNumber: "TRACK-123",
      carrierName: null,
    }).success,
    true,
  );
  assert.equal(
    adminFulfillmentUpdateSchema.safeParse({ shipmentStatus: "UNKNOWN" }).success,
    false,
  );
  assert.equal(
    adminFulfillmentUpdateSchema.safeParse({
      trackingNumber: "TRACK-123",
      paymentStatus: "PAID",
    }).success,
    false,
  );
  assert.equal(adminFulfillmentUpdateSchema.safeParse({}).success, false);
});

test("shipment filters validate and generic order edits cannot bypass fulfilment", () => {
  assert.equal(
    adminPageQuerySchema.safeParse({ shipmentStatus: "IN_TRANSIT" }).success,
    true,
  );
  assert.equal(
    adminPageQuerySchema.safeParse({ shipmentStatus: "ON_THE_WAY" }).success,
    false,
  );
  assert.equal(canAdminTransitionOrder("PROCESSING", "CANCELLED"), true);
  assert.equal(canAdminTransitionOrder("PROCESSING", "SHIPPED"), false);
});
