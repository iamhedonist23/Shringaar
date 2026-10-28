import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError, readJson } from "@/lib/api-response";
import { createCategorySchema } from "@/lib/catalog-schemas";
import { adminPageQuerySchema } from "@/lib/admin-schemas";
import { validationError } from "@/lib/api-response";
import {
  createCategoryRecord,
  listCategoryRecords,
} from "@/lib/repositories/product.repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;
  const query = adminPageQuerySchema.pick({ page: true }).safeParse({
    page: new URL(request.url).searchParams.get("page") ?? undefined,
  });
  if (!query.success) return validationError(query.error);
  try {
    const pageSize = 50;
    const allCategories = await listCategoryRecords(true);
    return NextResponse.json({
      categories: allCategories.slice((query.data.page - 1) * pageSize, query.data.page * pageSize),
      page: query.data.page,
      pageSize,
      total: allCategories.length,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }
  const body = await readJson(request);
  if (body.response) return body.response;

  const parsed = createCategorySchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);
  try {
    const category = await createCategoryRecord(parsed.data, authorization.user);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
