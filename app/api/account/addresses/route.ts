import { NextResponse } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api-response";
import { getCustomerSession } from "@/lib/customer-auth";
import { createAddressSchema } from "@/lib/customer-schemas";
import { isSameOriginRequest } from "@/lib/admin-auth";
import {
  createCustomerAddress,
  listCustomerAddresses,
} from "@/lib/repositories/customer.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getCustomerSession(request.headers);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const addresses = await listCustomerAddresses(session.user.id);
    return NextResponse.json({ addresses });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const session = await getCustomerSession(request.headers);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await readJson(request);
  if (body.response) return body.response;
  const parsed = createAddressSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const address = await createCustomerAddress(session.user.id, {
      ...parsed.data,
      addressLine2: parsed.data.addressLine2 || null,
      isDefault: parsed.data.isDefault ?? false,
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
