import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { isSameOriginRequest } from "@/lib/admin-auth";
import {
  FirebaseCustomerIdentityError,
  syncFirebaseCustomer,
} from "@/lib/firebase-customer";
import {
  FirebaseAdminConfigurationError,
  getFirebaseAdminAuth,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionCookieName = "shringaar_session";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("idToken" in body) ||
    typeof body.idToken !== "string" ||
    body.idToken.length === 0 ||
    body.idToken.length > 8192
  ) {
    return NextResponse.json({ error: "A valid Firebase ID token is required." }, { status: 400 });
  }

  try {
    const decodedToken: DecodedIdToken = await getFirebaseAdminAuth().verifyIdToken(
      body.idToken,
      true,
    );
    if (!decodedToken.email || decodedToken.email_verified !== true) {
      return NextResponse.json(
        { error: "Verify your email address before continuing." },
        { status: 403 },
      );
    }

    await syncFirebaseCustomer(decodedToken);
    const sessionCookie = await getFirebaseAdminAuth().createSessionCookie(
      body.idToken,
      { expiresIn: sessionDurationMs },
    );
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(sessionCookieName, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionDurationMs / 1000,
    });
    return response;
  } catch (error) {
    if (error instanceof FirebaseCustomerIdentityError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof FirebaseAdminConfigurationError) {
      console.error("Firebase Admin configuration error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (isFirebaseAuthError(error)) {
      return NextResponse.json({ error: "The sign-in session is invalid or expired." }, { status: 401 });
    }
    const errorCode =
      error !== null && typeof error === "object" && "code" in error &&
      typeof error.code === "string"
        ? error.code
        : error instanceof Error
          ? error.name
          : "UnknownError";
    console.error(`Firebase session exchange failed (${errorCode}).`);
    return NextResponse.json({ error: "Authentication service is unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
