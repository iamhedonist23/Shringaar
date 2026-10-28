import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/admin-auth";
import { apiError, readJson, validationError } from "@/lib/api-response";
import { newsletterSignupSchema } from "@/lib/newsletter-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const parsed = newsletterSignupSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const audienceId = process.env.RESEND_AUDIENCE_ID?.trim();
  if (!apiKey || !audienceId) {
    return NextResponse.json(
      { error: "Newsletter signup is not configured yet. Please check back soon." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: parsed.data.email,
          unsubscribed: false,
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );

    if (!response.ok && response.status !== 409) {
      console.error("Newsletter provider request failed:", response.status);
      return NextResponse.json(
        { error: "We could not subscribe you right now. Please try again later." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: "Thanks for subscribing. Look out for a note from Shringaar.",
    });
  } catch (error) {
    console.error("Newsletter provider request failed:", error);
    return apiError(new Error("Newsletter signup is temporarily unavailable."));
  }
}
