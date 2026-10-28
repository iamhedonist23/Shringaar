import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-4 py-12">
      <section className="w-full max-w-md rounded-card border border-border bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-contrast">Shringaar administration</p>
        <h1 className="font-display mt-3 text-3xl text-plum">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Use your authorized administrator account.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
