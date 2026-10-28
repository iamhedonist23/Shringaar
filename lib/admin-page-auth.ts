import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { adminSessionCookieName } from "@/lib/admin-auth";
import { isAdminRole } from "@/lib/auth";

export async function requireAdminPage() {
  const sessionCookie = (await cookies()).get(adminSessionCookieName)?.value;
  if (!sessionCookie) redirect("/admin/login");
  try {
    const session = await getFirebaseAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
    if (session.admin !== true && !isAdminRole(session.role)) redirect("/admin/login");
    return {
      id: session.uid,
      name: session.name ?? session.email ?? "Shringaar Admin",
      email: session.email ?? "",
      role: "ADMIN" as const,
    };
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string" &&
      error.code.startsWith("auth/")
    ) {
      redirect("/admin/login");
    }
    throw error;
  }
}
