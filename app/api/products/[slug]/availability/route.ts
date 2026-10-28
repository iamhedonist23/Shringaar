import { NextResponse } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api-response";
import { getProductBySlug } from "@/lib/catalog";
import {
  slugParamSchema,
  variantAvailabilityRequestSchema,
  variantAvailabilityResponseSchema,
} from "@/lib/catalog-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const parsedSlug = slugParamSchema.safeParse(slug);
  if (!parsedSlug.success) return validationError(parsedSlug.error);

  const { data, response } = await readJson(request);
  if (response) return response;
  const parsedBody = variantAvailabilityRequestSchema.safeParse(data);
  if (!parsedBody.success) return validationError(parsedBody.error);

  try {
    const product = await getProductBySlug(parsedSlug.data);
    const variant = product?.variants.find(
      (item) => item.id === parsedBody.data.variantId,
    );
    if (!variant) {
      return NextResponse.json({ error: "Product variant not found." }, { status: 404 });
    }

    const result = variantAvailabilityResponseSchema.parse({
      variantId: variant.id,
      sku: variant.sku,
      available: variant.inventoryQuantity >= parsedBody.data.quantity,
      inventoryQuantity: variant.inventoryQuantity,
      price: variant.price.toFixed(2),
    });
    return NextResponse.json(result, {
      status: result.available ? 200 : 409,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
