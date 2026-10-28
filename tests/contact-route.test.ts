import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/contact/route";

function request(body: unknown, origin = "https://shringaar.test") {
  return new Request("https://shringaar.test/api/contact", {
    method: "POST",
    headers: {
      Origin: origin,
      Host: "shringaar.test",
      "X-Forwarded-Proto": "https",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

const validMessage = {
  name: "Asha Customer",
  email: "  ASHA@EXAMPLE.COM ",
  orderNumber: "SHR-123",
  message: "I have a question about my recent order.",
  website: "",
};

test("contact route validates requests and rejects cross-origin submissions", async () => {
  const invalid = await POST(request({ ...validMessage, email: "invalid" }));
  assert.equal(invalid.status, 400);

  const crossOrigin = await POST(request(validMessage, "https://attacker.test"));
  assert.equal(crossOrigin.status, 403);
});

test("contact honeypot returns success without sending email", async () => {
  const response = await POST(request({ ...validMessage, website: "spam" }));
  assert.equal(response.status, 200);
});
