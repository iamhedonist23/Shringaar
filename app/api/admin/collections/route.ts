import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError, readJson } from "@/lib/api-response";
import { createCollection } from "@/lib/catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization.response) return authorization.response;
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }
  const body = await readJson(request);
  if (body.response) return body.response;

  try {
    const collection = await createCollection(body.data, authorization.user);
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
