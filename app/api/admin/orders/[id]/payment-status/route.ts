import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminIdSchema } from "@/lib/admin-schemas";
import { apiError, validationError } from "@/lib/api-response";
import {
  PaymentStatusNotReadyError,
  PaymentStatusTokenInvalidError,
  refreshUroPayPaymentForOrder,
} from "@/lib/uropay-payments";
import { UroPayError } from "@/lib/uropay-client";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;
  const { id } = await context.params;
  const parsedId = adminIdSchema.safeParse(id);
  if (!parsedId.success) return validationError(parsedId.error);

  try {
    const status = await refreshUroPayPaymentForOrder(parsedId.data);
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch (error) {
    if (error instanceof PaymentStatusTokenInvalidError) {
      return NextResponse.json(
        { error: "UroPay payment was not found for this order." },
        { status: 404 },
      );
    }
    if (error instanceof PaymentStatusNotReadyError) {
      return NextResponse.json(
        { error: "UroPay checkout has not been initialized for this order." },
        { status: 409 },
      );
    }
    if (error instanceof UroPayError) {
      console.error("Admin UroPay status refresh failed.");
      return NextResponse.json(
        { error: "UroPay status could not be refreshed. Please try again." },
        { status: 502 },
      );
    }
    return apiError(error);
  }
}
