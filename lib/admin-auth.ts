import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { isAdminRole } from "@/lib/auth";

export const adminSessionCookieName = "shringaar_admin_session";

export function isSameOrigin(origin: string | null, expectedOrigin: string) {
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    const forwardedProtocol = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const protocol =
      forwardedProtocol === "http" || forwardedProtocol === "https"
        ? `${forwardedProtocol}:`
        : originUrl.protocol;
    return isSameOrigin(origin, `${protocol}//${host}`);
  } catch {
    return false;
  }
}

export function isTrustedAdminRequest(
  method: string,
  origin: string | null,
  expectedOrigin: string,
) {
  if (method.toUpperCase() === "GET" || method.toUpperCase() === "HEAD") {
    return true;
  }
  return isSameOrigin(origin, expectedOrigin);
}

function isFirebaseAuthError(error: unknown) {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("auth/")
  );
}

function cookieFromHeader(request: Request) {
  const rawCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${adminSessionCookieName}=`))
    ?.slice(adminSessionCookieName.length + 1);
  if (!rawCookie) return null;
  try {
    return decodeURIComponent(rawCookie);
  } catch {
    return null;
  }
}

export async function requireAdmin(request: Request) {
  const origin = request.headers.get("origin");
  const configuredUrl = process.env.AUTH_URL;

  if (!isTrustedAdminRequest(request.method, origin, configuredUrl ?? "")) {
    return {
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
      user: null,
    };
  }

  const sessionCookie = cookieFromHeader(request);
  if (!sessionCookie) {
    return {
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
      user: null,
    };
  }

  try {
    const session = await getFirebaseAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
    if (session.admin !== true && !isAdminRole(session.role)) {
      return {
        response: NextResponse.json({ error: "Admin access required." }, { status: 403 }),
        user: null,
      };
    }
    return {
      response: null,
      user: {
        id: session.uid,
        name: session.name ?? session.email ?? "Shringaar Admin",
        email: session.email ?? "",
        role: "ADMIN" as const,
      },
    };
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      return {
        response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
        user: null,
      };
    }
    console.error("Admin authentication check failed:", error);
    return {
      response: NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 }),
      user: null,
    };
  }
}

export function isSameOriginAdminRole(origin: string | null, expectedOrigin: string, role: unknown) {
  return isSameOrigin(origin, expectedOrigin) && isAdminRole(role);
}
