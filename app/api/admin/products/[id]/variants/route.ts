import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminIdSchema, createAdminVariantSchema } from "@/lib/admin-schemas";
import { apiError, readJson, validationError } from "@/lib/api-response";
import { createProductVariantRecord } from "@/lib/repositories/product.repository";

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
  const body = await readJson(request);
  if (body.response) return body.response;
  const parsedBody = createAdminVariantSchema.safeParse(body.data);
  if (!parsedBody.success) return validationError(parsedBody.error);

  try {
    const result = await createProductVariantRecord(
      parsedId.data,
      {
        ...parsedBody.data,
        color: parsedBody.data.color ?? null,
        options: parsedBody.data.options ?? null,
        compareAtPrice: parsedBody.data.compareAtPrice ?? null,
      },
      authorization.user,
    );
    if (!result) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ variant: result }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
