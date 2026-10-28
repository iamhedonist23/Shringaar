import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/newsletter/route";

function request(body: unknown) {
  return new Request("https://shringaar.test/api/newsletter", {
    method: "POST",
    headers: {
      Origin: "https://shringaar.test",
      Host: "shringaar.test",
      "X-Forwarded-Proto": "https",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

test("newsletter route subscribes a consented address through the configured provider", async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousAudienceId = process.env.RESEND_AUDIENCE_ID;
  const originalFetch = globalThis.fetch;
  let providerRequest: { url: string; authorization: string | null; body: string } | null =
    null;

  process.env.RESEND_API_KEY = "test-newsletter-key";
  process.env.RESEND_AUDIENCE_ID = "test-audience";
  globalThis.fetch = async (input, init) => {
    providerRequest = {
      url: String(input),
      authorization: new Headers(init?.headers).get("authorization"),
      body: String(init?.body),
    };
    return new Response('{"id":"contact_test"}', { status: 201 });
  };

  try {
    const response = await POST(
      request({ email: " Shopper@Example.com ", consent: true }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      message: "Thanks for subscribing. Look out for a note from Shringaar.",
    });
    assert.deepEqual(providerRequest, {
      url: "https://api.resend.com/audiences/test-audience/contacts",
      authorization: "Bearer test-newsletter-key",
      body: JSON.stringify({ email: "shopper@example.com", unsubscribed: false }),
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
    if (previousAudienceId === undefined) delete process.env.RESEND_AUDIENCE_ID;
    else process.env.RESEND_AUDIENCE_ID = previousAudienceId;
  }
});

test("newsletter route fails explicitly if provider configuration is missing", async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousAudienceId = process.env.RESEND_AUDIENCE_ID;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_AUDIENCE_ID;

  try {
    const response = await POST(
      request({ email: "shopper@example.com", consent: true }),
    );
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Newsletter signup is not configured yet. Please check back soon.",
    });
  } finally {
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
    if (previousAudienceId === undefined) delete process.env.RESEND_AUDIENCE_ID;
    else process.env.RESEND_AUDIENCE_ID = previousAudienceId;
  }
});
