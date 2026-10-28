import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError, readJson, validationError } from "@/lib/api-response";
import { createProductSchema } from "@/lib/catalog-schemas";
import { adminPageQuerySchema } from "@/lib/admin-schemas";
import {
  createProductRecord,
  listAdminProducts,
  listCategoryRecords,
} from "@/lib/repositories/product.repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;

  const url = new URL(request.url);
  const query = adminPageQuerySchema.pick({ page: true, q: true }).safeParse({
    page: url.searchParams.get("page") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  if (!query.success) return validationError(query.error);

  try {
    const take = 25;
    const [{ total, products }, categories] = await Promise.all([
      listAdminProducts({
        page: query.data.page,
        pageSize: take,
        q: query.data.q,
      }),
      listCategoryRecords(true),
    ]);
    return NextResponse.json({
      products,
      categories,
      page: query.data.page,
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
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

  const parsed = createProductSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const product = await createProductRecord(parsed.data, authorization.user);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
