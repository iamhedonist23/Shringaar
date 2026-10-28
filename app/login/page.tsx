import type { Metadata } from "next";
import { AuthForm } from "@/components/account/auth-form";
import { AuthPageShell } from "@/components/account/page-shell";
import { safeReturnPath } from "@/lib/return-to";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string | string[];
    passwordReset?: string;
  }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnPath(
    typeof params.returnTo === "string" ? params.returnTo : undefined,
  );
  return (
    <AuthPageShell>
      <AuthForm
        mode="login"
        passwordResetComplete={params.passwordReset === "1"}
        returnTo={returnTo}
      />
    </AuthPageShell>
  );
}
