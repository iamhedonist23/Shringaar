import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  FirestoreReferencedRecordError,
  FirestoreUniqueValueError,
} from "@/lib/repositories/product.repository";

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      error: "Invalid request.",
      issues: error.issues.map(({ path, message }) => ({
        path: path.join("."),
        message,
      })),
    },
    { status: 400 },
  );
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) return validationError(error);

  if (error instanceof FirestoreUniqueValueError) {
    return NextResponse.json(
      { error: "A record with one of these unique values already exists." },
      { status: 409 },
    );
  }
  if (error instanceof FirestoreReferencedRecordError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 },
    );
  }

  console.error("API request failed:", error);
  return NextResponse.json(
    { error: "The request could not be completed." },
    { status: 500 },
  );
}

export async function readJson(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 256 * 1024) {
    return {
      data: null,
      response: NextResponse.json({ error: "Request body is too large." }, { status: 413 }),
    };
  }
  try {
    return { data: await request.json(), response: null };
  } catch {
    return {
      data: null,
      response: NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }),
    };
  }
}
