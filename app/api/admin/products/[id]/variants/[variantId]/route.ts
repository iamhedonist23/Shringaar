import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminIdSchema, adminVariantUpdateSchema } from "@/lib/admin-schemas";
import { apiError, readJson, validationError } from "@/lib/api-response";
import {
  archiveProductVariantRecord,
  updateProductVariantRecord,
} from "@/lib/repositories/product.repository";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; variantId: string }> },
) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;
  const { id, variantId } = await context.params;
  const parsedProductId = adminIdSchema.safeParse(id);
  const parsedVariantId = adminIdSchema.safeParse(variantId);
  if (!parsedProductId.success) return validationError(parsedProductId.error);
  if (!parsedVariantId.success) return validationError(parsedVariantId.error);
  const body = await readJson(request);
  if (body.response) return body.response;
  const parsedBody = adminVariantUpdateSchema.safeParse(body.data);
  if (!parsedBody.success) return validationError(parsedBody.error);

  try {
    const result = await updateProductVariantRecord(
      parsedProductId.data,
      parsedVariantId.data,
      parsedBody.data,
      authorization.user,
    );
    if (!result) return NextResponse.json({ error: "Product variant not found." }, { status: 404 });
    return NextResponse.json({ variant: result });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; variantId: string }> },
) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;
  const { id, variantId } = await context.params;
  const parsedProductId = adminIdSchema.safeParse(id);
  const parsedVariantId = adminIdSchema.safeParse(variantId);
  if (!parsedProductId.success) return validationError(parsedProductId.error);
  if (!parsedVariantId.success) return validationError(parsedVariantId.error);
  try {
    const result = await archiveProductVariantRecord(
      parsedProductId.data,
      parsedVariantId.data,
      authorization.user,
    );
    if (!result) return NextResponse.json({ error: "Product variant not found." }, { status: 404 });
    return NextResponse.json({ variant: result });
  } catch (error) {
    return apiError(error);
  }
}
