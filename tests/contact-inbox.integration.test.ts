import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/contact/route";
import { listContactMessages } from "../lib/repositories/contact-message.repository";

test("contact form submission is saved and available in the admin inbox", async (t) => {
  const emulator = process.env.FIRESTORE_EMULATOR_HOST;
  if (!emulator || !/^(localhost|127\.0\.0\.1):\d+$/.test(emulator)) {
    t.skip("Set FIRESTORE_EMULATOR_HOST to run contact inbox integration coverage.");
    return;
  }

  const previousProject = process.env.FIREBASE_ADMIN_PROJECT_ID;
  process.env.FIREBASE_ADMIN_PROJECT_ID = "shringaar-contact-test";
  const orderNumber = `SHR-${Date.now()}`;
  const request = new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      Host: "localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Asha Customer",
      email: "  ASHA@EXAMPLE.COM ",
      orderNumber,
      message: "I have a question about my recent order.",
      website: "",
    }),
  });

  try {
    const response = await POST(request);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      message: "Thanks for contacting Shringaar. Your message has been received.",
    });

    const savedMessages = await listContactMessages();
    assert.ok(savedMessages.some((message) =>
      message.orderNumber === orderNumber &&
      message.email === "asha@example.com" &&
      message.message === "I have a question about my recent order.",
    ));
  } finally {
    if (previousProject === undefined) delete process.env.FIREBASE_ADMIN_PROJECT_ID;
    else process.env.FIREBASE_ADMIN_PROJECT_ID = previousProject;
  }
});
