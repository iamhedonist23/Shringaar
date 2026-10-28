import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminIdSchema, orderStatusUpdateSchema } from "@/lib/admin-schemas";
import { apiError, readJson, validationError } from "@/lib/api-response";
import {
  getAdminOrderDetails,
  OrderInventoryUnavailableError,
  updateAdminOrderStatus,
} from "@/lib/repositories/order.repository";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;
  const { id } = await context.params;
  const parsedId = adminIdSchema.safeParse(id);
  if (!parsedId.success) return validationError(parsedId.error);
  try {
    const result = await getAdminOrderDetails(parsedId.data);
    if (!result) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}

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
  const parsedBody = orderStatusUpdateSchema.safeParse(body.data);
  if (!parsedBody.success) return validationError(parsedBody.error);

  try {
    const outcome = await updateAdminOrderStatus(
      parsedId.data,
      parsedBody.data.status,
      authorization.user,
    );
    if ("missing" in outcome) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if ("invalidTransition" in outcome) {
      return NextResponse.json(
        { error: `Order cannot move from ${outcome.from} to ${outcome.to}.` },
        { status: 409 },
      );
    }
    if ("paidCancellation" in outcome) {
      return NextResponse.json(
        { error: "A paid order cannot be cancelled here. Resolve the payment/refund first." },
        { status: 409 },
      );
    }
    if ("dispatchedCancellation" in outcome) {
      return NextResponse.json(
        { error: "A dispatched shipment cannot be cancelled or restocked here." },
        { status: 409 },
      );
    }
    if ("unpaidUroPay" in outcome) {
      return NextResponse.json(
        { error: "UroPay must confirm payment before this order can be confirmed." },
        { status: 409 },
      );
    }
    return NextResponse.json({ order: outcome.order });
  } catch (error) {
    if (error instanceof OrderInventoryUnavailableError) {
      return NextResponse.json(
        { error: "Payment was received, but current stock is insufficient. Restock or resolve inventory before confirming." },
        { status: 409 },
      );
    }
    return apiError(error);
  }
}
