import type { Metadata } from "next";
import { AuthForm } from "@/components/account/auth-form";
import { AuthPageShell } from "@/components/account/page-shell";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return <AuthPageShell><AuthForm mode="forgot" /></AuthPageShell>;
}
