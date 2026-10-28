import { NextResponse } from "next/server";
import { apiError, readJson, validationError } from "@/lib/api-response";
import { createCartQuote } from "@/lib/cart-service";
import {
  cartQuoteRequestSchema,
  cartQuoteResponseSchema,
} from "@/lib/cart-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { data, response } = await readJson(request);
  if (response) return response;
  const parsed = cartQuoteRequestSchema.safeParse(data);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const quote = cartQuoteResponseSchema.parse(
      await createCartQuote(parsed.data.lines),
    );
    return NextResponse.json(quote, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
