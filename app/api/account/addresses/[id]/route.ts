import { NextResponse } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api-response";
import { getCustomerSession } from "@/lib/customer-auth";
import { addressIdSchema, updateAddressSchema } from "@/lib/customer-schemas";
import { isSameOriginRequest } from "@/lib/admin-auth";
import {
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@/lib/repositories/customer.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const session = await getCustomerSession(request.headers);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  const parsedId = addressIdSchema.safeParse(id);
  if (!parsedId.success) return validationError(parsedId.error);
  const body = await readJson(request);
  if (body.response) return body.response;
  const parsed = updateAddressSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const address = await updateCustomerAddress(
      session.user.id,
      parsedId.data,
      parsed.data,
    );
    if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    return NextResponse.json({ address });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const session = await getCustomerSession(request.headers);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  const parsedId = addressIdSchema.safeParse(id);
  if (!parsedId.success) return validationError(parsedId.error);

  try {
    const deleted = await deleteCustomerAddress(session.user.id, parsedId.data);
    if (!deleted) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
