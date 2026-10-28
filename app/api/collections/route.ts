import { NextResponse } from "next/server";
import { apiError, validationError } from "@/lib/api-response";
import { listCollections } from "@/lib/catalog";
import { productListQuerySchema } from "@/lib/catalog-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = productListQuerySchema.shape.limit.safeParse(
    url.searchParams.get("limit") ?? undefined,
  );
  if (!query.success) return validationError(query.error);

  try {
    return NextResponse.json({ collections: await listCollections({ limit: query.data }) });
  } catch (error) {
    return apiError(error);
  }
}
