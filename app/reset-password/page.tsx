import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/account/auth-form";
import { AuthPageShell } from "@/components/account/page-shell";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ oobCode?: string; mode?: string; error?: string }>;
}) {
  const params = await searchParams;
  const invalidAction =
    Boolean(params.error) ||
    params.mode !== "resetPassword" ||
    !params.oobCode;
  return (
    <AuthPageShell>
      {invalidAction ? (
        <section className="mx-auto my-10 max-w-lg rounded-card border border-border bg-white p-8 shadow-card">
          <h1 className="font-display text-3xl text-plum">Reset link unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-muted">This password reset link is invalid or has expired. Request a new link to continue.</p>
          <Link className="mt-6 inline-flex min-h-11 items-center rounded-control bg-plum px-4 text-sm font-semibold text-white" href="/forgot-password">Request another link</Link>
        </section>
      ) : (
        <AuthForm mode="reset" token={params.oobCode} />
      )}
    </AuthPageShell>
  );
}
