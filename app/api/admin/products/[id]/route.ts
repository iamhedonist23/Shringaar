import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminIdSchema, updateAdminProductSchema } from "@/lib/admin-schemas";
import { apiError, readJson, validationError } from "@/lib/api-response";
import {
  archiveProductRecord,
  getProductRecord,
  updateProductRecord,
} from "@/lib/repositories/product.repository";

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
    const product = await getProductRecord(parsedId.data);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product });
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
  const parsedBody = updateAdminProductSchema.safeParse(body.data);
  if (!parsedBody.success) return validationError(parsedBody.error);

  try {
    const product = await updateProductRecord(
      parsedId.data,
      parsedBody.data,
      authorization.user,
    );
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;
  const { id } = await context.params;
  const parsedId = adminIdSchema.safeParse(id);
  if (!parsedId.success) return validationError(parsedId.error);
  try {
    const product = await archiveProductRecord(parsedId.data, authorization.user);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    return apiError(error);
  }
}
