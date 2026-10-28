import assert from "node:assert/strict";
import test from "node:test";
import { GET as getAddresses } from "../app/api/account/addresses/route";
import {
  DELETE as clearFirebaseSession,
  POST as createFirebaseSession,
} from "../app/api/auth/session/route";

const origin = "http://localhost:3000";

function sameOriginHeaders() {
  return {
    Origin: origin,
    Host: "localhost:3000",
    "Content-Type": "application/json",
  };
}

test("Firebase session exchange rejects cross-origin and incomplete requests", async () => {
  const crossOrigin = await createFirebaseSession(
    new Request(`${origin}/api/auth/session`, {
      method: "POST",
      headers: { ...sameOriginHeaders(), Origin: "https://attacker.example" },
      body: JSON.stringify({ idToken: "not-a-token" }),
    }),
  );
  assert.equal(crossOrigin.status, 403);

  const missingToken = await createFirebaseSession(
    new Request(`${origin}/api/auth/session`, {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({}),
    }),
  );
  assert.equal(missingToken.status, 400);
});

test("Firebase session exchange gives a safe setup error when Admin credentials are missing", async () => {
  const previousProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const previousAdminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const previousClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const previousPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const previousUseAdc = process.env.FIREBASE_ADMIN_USE_ADC;
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-firebase-project";
  delete process.env.FIREBASE_ADMIN_PROJECT_ID;
  delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  delete process.env.FIREBASE_ADMIN_USE_ADC;

  try {
    const response = await createFirebaseSession(
      new Request(`${origin}/api/auth/session`, {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({ idToken: "a-valid-shaped-token" }),
      }),
    );
    assert.equal(response.status, 503);
    const body = (await response.json()) as { error: string };
    assert.match(body.error, /FIREBASE_ADMIN_PROJECT_ID/);
    assert.doesNotMatch(
      body.error,
      /-----BEGIN (?:RSA )?PRIVATE KEY-----|service-account key/i,
    );
  } finally {
    if (previousProjectId === undefined) {
      delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    } else {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = previousProjectId;
    }
    if (previousAdminProjectId === undefined) {
      delete process.env.FIREBASE_ADMIN_PROJECT_ID;
    } else {
      process.env.FIREBASE_ADMIN_PROJECT_ID = previousAdminProjectId;
    }
    if (previousClientEmail === undefined) {
      delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    } else {
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = previousClientEmail;
    }
    if (previousPrivateKey === undefined) {
      delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    } else {
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = previousPrivateKey;
    }
    if (previousUseAdc === undefined) {
      delete process.env.FIREBASE_ADMIN_USE_ADC;
    } else {
      process.env.FIREBASE_ADMIN_USE_ADC = previousUseAdc;
    }
  }
});

test("Firebase sign-out expires the HTTP-only session cookie", async () => {
  const response = await clearFirebaseSession(
    new Request(`${origin}/api/auth/session`, {
      method: "DELETE",
      headers: sameOriginHeaders(),
    }),
  );
  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie");
  assert.match(setCookie ?? "", /^shringaar_session=/);
  assert.match(setCookie ?? "", /max-age=0/i);
  assert.match(setCookie ?? "", /httponly/i);
});

test("customer address API rejects unauthenticated requests", async () => {
  const response = await getAddresses(
    new Request(`${origin}/api/account/addresses`),
  );
  assert.equal(response.status, 401);
});
