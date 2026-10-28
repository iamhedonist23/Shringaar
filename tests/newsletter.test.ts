import assert from "node:assert/strict";
import test from "node:test";
import { newsletterSignupSchema } from "../lib/newsletter-schema";

test("newsletter signup normalizes valid email addresses with consent", () => {
  assert.deepEqual(
    newsletterSignupSchema.parse({
      email: "  SHOPPER@EXAMPLE.COM ",
      consent: true,
    }),
    { email: "shopper@example.com", consent: true },
  );
});

test("newsletter signup rejects invalid email and missing consent", () => {
  assert.equal(
    newsletterSignupSchema.safeParse({
      email: "not-an-email",
      consent: true,
    }).success,
    false,
  );
  assert.equal(
    newsletterSignupSchema.safeParse({
      email: "shopper@example.com",
      consent: false,
    }).success,
    false,
  );
});
