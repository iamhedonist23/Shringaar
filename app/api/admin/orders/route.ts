import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPageQuerySchema } from "@/lib/admin-schemas";
import { apiError, validationError } from "@/lib/api-response";
import { listAdminOrders } from "@/lib/repositories/order.repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  const url = new URL(request.url);
  const parsed = adminPageQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    shipmentStatus: url.searchParams.get("shipmentStatus") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  try {
    return NextResponse.json(await listAdminOrders(parsed.data));
  } catch (error) {
    return apiError(error);
  }
}
