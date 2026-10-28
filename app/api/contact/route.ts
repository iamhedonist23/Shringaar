import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/admin-auth";
import { readJson, validationError } from "@/lib/api-response";
import { contactMessageSchema } from "@/lib/contact-schema";
import { createContactMessage } from "@/lib/repositories/contact-message.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const successMessage =
  "Thanks for contacting Shringaar. Your message has been received.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json." },
      { status: 415 },
    );
  }

  const body = await readJson(request);
  if (body.response) return body.response;
  const parsed = contactMessageSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  if (parsed.data.website) {
    return NextResponse.json({ message: successMessage });
  }

  try {
    await createContactMessage({
      name: parsed.data.name,
      email: parsed.data.email,
      orderNumber: parsed.data.orderNumber,
      message: parsed.data.message,
    });
    return NextResponse.json({ message: successMessage });
  } catch (error) {
    console.error("Contact message could not be saved:", error);
    return NextResponse.json(
      { error: "Your message could not be saved right now. Please email us directly." },
      { status: 503 },
    );
  }
}
