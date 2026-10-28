import { NextResponse } from "next/server";
import { apiError, validationError } from "@/lib/api-response";
import { getProductBySlug } from "@/lib/catalog";
import { slugParamSchema } from "@/lib/catalog-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const parsedSlug = slugParamSchema.safeParse(slug);
  if (!parsedSlug.success) return validationError(parsedSlug.error);

  try {
    const product = await getProductBySlug(parsedSlug.data);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    return apiError(error);
  }
}
