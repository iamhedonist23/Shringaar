import type { Metadata } from "next";
import { AuthForm } from "@/components/account/auth-form";
import { AuthPageShell } from "@/components/account/page-shell";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return <AuthPageShell><AuthForm mode="register" /></AuthPageShell>;
}
