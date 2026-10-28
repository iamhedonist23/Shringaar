import { NextResponse } from "next/server";
import { FirebaseAdminConfigurationError, getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { adminSessionCookieName, isSameOriginRequest } from "@/lib/admin-auth";
import { readJson } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionDurationMs = 5 * 24 * 60 * 60 * 1000;

function isFirebaseAuthError(error: unknown) {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("auth/")
  );
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }

  const body = await readJson(request);
  if (body.response) return body.response;
  if (
    !body.data ||
    typeof body.data !== "object" ||
    !("idToken" in body.data) ||
    typeof body.data.idToken !== "string" ||
    body.data.idToken.length === 0 ||
    body.data.idToken.length > 8192
  ) {
    return NextResponse.json({ error: "A valid Firebase ID token is required." }, { status: 400 });
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(body.data.idToken, true);
    if (decodedToken.admin !== true) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }
    const cookie = await auth.createSessionCookie(body.data.idToken, {
      expiresIn: sessionDurationMs,
    });
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(adminSessionCookieName, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionDurationMs / 1000,
    });
    return response;
  } catch (error) {
    if (error instanceof FirebaseAdminConfigurationError) {
      console.error("Firebase Admin configuration error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (isFirebaseAuthError(error)) {
      return NextResponse.json({ error: "The sign-in session is invalid or expired." }, { status: 401 });
    }
    console.error("Admin Firebase session exchange failed:", error);
    return NextResponse.json({ error: "Authentication service is unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(adminSessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
