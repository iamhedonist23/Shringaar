import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  adminFulfillmentUpdateSchema,
  adminIdSchema,
} from "@/lib/admin-schemas";
import { apiError, readJson, validationError } from "@/lib/api-response";
import { updateAdminOrderFulfillment } from "@/lib/repositories/order.repository";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;
  const { id } = await context.params;
  const parsedId = adminIdSchema.safeParse(id);
  if (!parsedId.success) return validationError(parsedId.error);

  const body = await readJson(request);
  if (body.response) return body.response;
  const parsedBody = adminFulfillmentUpdateSchema.safeParse(body.data);
  if (!parsedBody.success) return validationError(parsedBody.error);

  try {
    const result = await updateAdminOrderFulfillment(
      parsedId.data,
      parsedBody.data,
      authorization.user,
    );
    if ("missing" in result) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if ("invalidTransition" in result) {
      return NextResponse.json(
        { error: `Shipment cannot move from ${result.from} to ${result.to}.` },
        { status: 409 },
      );
    }
    if ("addressLocked" in result) {
      return NextResponse.json(
        { error: "The delivery address cannot be changed after dispatch." },
        { status: 409 },
      );
    }
    if ("orderCancelled" in result) {
      return NextResponse.json(
        { error: "A cancelled order cannot be moved back into fulfilment." },
        { status: 409 },
      );
    }
    if ("paymentPending" in result) {
      return NextResponse.json(
        { error: "A non-COD order must be paid before dispatch." },
        { status: 409 },
      );
    }
    if ("orderStatusConflict" in result) {
      return NextResponse.json(
        { error: "Advance the order through its processing status before changing this shipment stage." },
        { status: 409 },
      );
    }
    return NextResponse.json({ order: result.order });
  } catch (error) {
    return apiError(error);
  }
}
