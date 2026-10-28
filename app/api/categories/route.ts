import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { listCategories } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ categories: await listCategories() });
  } catch (error) {
    return apiError(error);
  }
}
