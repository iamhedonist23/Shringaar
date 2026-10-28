import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import {
  PaymentStatusNotReadyError,
  PaymentStatusTokenInvalidError,
  refreshUroPayPayment,
} from "@/lib/uropay-payments";
import { UroPayError } from "@/lib/uropay-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tokenSchema = z.uuid();

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const parsedToken = tokenSchema.safeParse(token);
  if (!parsedToken.success) {
    return NextResponse.json({ error: "A valid payment status token is required." }, { status: 400 });
  }

  try {
    const status = await refreshUroPayPayment(parsedToken.data);
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch (error) {
    if (error instanceof PaymentStatusTokenInvalidError) {
      return NextResponse.json({ error: "Payment status session not found." }, { status: 404 });
    }
    if (error instanceof PaymentStatusNotReadyError) {
      return NextResponse.json({ error: "Payment checkout is still being prepared." }, { status: 409 });
    }
    if (error instanceof UroPayError) {
      console.error("UroPay status lookup failed.");
      return NextResponse.json({ error: "Payment status could not be checked. Please try again." }, { status: 502 });
    }
    return apiError(error);
  }
}
