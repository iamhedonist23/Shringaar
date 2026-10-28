import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminIdSchema, updateAdminCategorySchema } from "@/lib/admin-schemas";
import { apiError, readJson, validationError } from "@/lib/api-response";
import {
  archiveCategoryRecord,
  updateCategoryRecord,
} from "@/lib/repositories/product.repository";

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
  const parsedBody = updateAdminCategorySchema.safeParse(body.data);
  if (!parsedBody.success) return validationError(parsedBody.error);

  try {
    const category = await updateCategoryRecord(
      parsedId.data,
      parsedBody.data,
      authorization.user,
    );
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    return NextResponse.json({ category });
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
    const category = await archiveCategoryRecord(parsedId.data, authorization.user);
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    return NextResponse.json({ category });
  } catch (error) {
    return apiError(error);
  }
}
