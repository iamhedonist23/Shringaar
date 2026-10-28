import { NextResponse } from "next/server";
import { apiError, validationError } from "@/lib/api-response";
import { listCategories, listProducts } from "@/lib/catalog";
import { productListQuerySchema } from "@/lib/catalog-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = productListQuerySchema.safeParse({
    category: url.searchParams.get("category") ?? undefined,
    collection: url.searchParams.get("collection") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!query.success) return validationError(query.error);

  try {
    const [categories, products] = await Promise.all([
      listCategories(),
      listProducts(query.data),
    ]);
    return NextResponse.json({ categories, products });
  } catch (error) {
    return apiError(error);
  }
}
