import assert from "node:assert/strict";
import test from "node:test";
import { safeReturnPath } from "../lib/return-to";

test("safeReturnPath preserves local account return paths", () => {
  assert.equal(safeReturnPath("/account/orders?status=shipped#latest"), "/account/orders?status=shipped#latest");
});

test("safeReturnPath rejects external and malformed destinations", () => {
  assert.equal(safeReturnPath("https://example.com"), "/account");
  assert.equal(safeReturnPath("//example.com"), "/account");
  assert.equal(safeReturnPath("/\\example.com"), "/account");
  assert.equal(safeReturnPath(undefined, "/"), "/");
});
