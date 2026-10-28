import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { getCustomer, upsertCustomer } from "@/lib/repositories/customer.repository";
import { safeReturnPath } from "@/lib/return-to";

const sessionCookieName = "shringaar_session";

function getCookieValue(requestHeaders: Headers, cookieName: string) {
  const rawCookie = requestHeaders
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!rawCookie) return null;
  try {
    return decodeURIComponent(rawCookie);
  } catch {
    return null;
  }
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

export async function getCustomerSession(requestHeaders: Headers) {
  const sessionCookie = getCookieValue(requestHeaders, sessionCookieName);
  if (!sessionCookie) return null;

  let decodedCookie;
  try {
    decodedCookie = await getFirebaseAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
  } catch (error) {
    if (isFirebaseAuthError(error)) return null;
    throw error;
  }
  if (decodedCookie.admin === true) return null;

  const customer = await getCustomer(decodedCookie.uid);
  if (!customer) return null;
  return {
    user: {
      id: customer.uid,
      name: customer.name,
      email: customer.email,
      image: customer.image,
    },
  };
}

export async function requireCustomerPage(returnTo = "/account") {
  const session = await getCustomerSession(await headers());
  if (!session) {
    redirect(`/login?returnTo=${encodeURIComponent(safeReturnPath(returnTo))}`);
  }
  return session;
}

export async function ensureCustomerProfile(user: {
  id: string;
  name: string;
  email: string;
}) {
  const customer = await upsertCustomer({
    uid: user.id,
    name: user.name,
    email: user.email,
  });
  return {
    id: customer.uid,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
}
