import assert from "node:assert/strict";
import test from "node:test";
import {
  addressFieldsSchema,
  createAddressSchema,
  updateAddressSchema,
} from "../lib/customer-schemas";

const validAddress = {
  fullName: "Shringaar Customer",
  phone: "9876543210",
  addressLine1: "12 Test Market Road",
  addressLine2: "Near City Park",
  locality: "Pink City",
  city: "Jaipur",
  state: "Rajasthan",
  postalCode: "302001",
  addressType: "HOME",
};

test("customer address validation accepts normalized home and work addresses", () => {
  assert.equal(addressFieldsSchema.safeParse(validAddress).success, true);
  assert.equal(
    createAddressSchema.safeParse({ ...validAddress, isDefault: true }).success,
    true,
  );
  assert.equal(
    createAddressSchema.safeParse({ ...validAddress, addressType: "OFFICE" }).success,
    false,
  );
});

test("customer address validation rejects unsafe, incomplete, and invalid contact data", () => {
  assert.equal(
    createAddressSchema.safeParse({ ...validAddress, phone: "12345" }).success,
    false,
  );
  assert.equal(
    createAddressSchema.safeParse({ ...validAddress, postalCode: "30200" }).success,
    false,
  );
  assert.equal(
    createAddressSchema.safeParse({ ...validAddress, addressLine1: "x".repeat(201) }).success,
    false,
  );
  assert.equal(
    createAddressSchema.safeParse({ ...validAddress, unknownField: "not accepted" }).success,
    false,
  );
  assert.equal(
    createAddressSchema.safeParse({ ...validAddress, locality: "Area\u0000Name" }).success,
    false,
  );
});

test("address updates require an explicit, valid field", () => {
  assert.equal(updateAddressSchema.safeParse({ isDefault: true }).success, true);
  assert.equal(updateAddressSchema.safeParse({}).success, false);
  assert.equal(updateAddressSchema.safeParse({ customerId: "someone-else" }).success, false);
});
