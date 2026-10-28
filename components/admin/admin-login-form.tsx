"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      if (!auth || !firebaseConfigured) {
        setError("Firebase Authentication is not configured for this site.");
        return;
      }
      const credential = await signInWithEmailAndPassword(
        auth,
        String(form.get("email")).trim().toLowerCase(),
        String(form.get("password")),
      );
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await credential.user.getIdToken() }),
      });
      if (!response.ok) {
        await signOut(auth);
        const result = await response.json().catch(() => null) as { error?: string } | null;
        setError(result?.error ?? (response.status === 401
          ? "Email or password is incorrect."
          : "Sign-in could not be completed. Please try again."));
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      const code = cause && typeof cause === "object" && "code" in cause
        ? String(cause.code)
        : "";
      setError(code.startsWith("auth/invalid-credential") || code.startsWith("auth/user-not-found") || code.startsWith("auth/wrong-password")
        ? "Email or password is incorrect."
        : cause instanceof Error
          ? cause.message
          : "Could not connect to the sign-in service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      {error && <p className="rounded-control bg-error/10 px-3 py-2 text-sm text-error" role="alert">{error}</p>}
      <label className="block space-y-2 text-sm font-medium text-plum" htmlFor="admin-email">
        Email
        <Input autoComplete="username" id="admin-email" maxLength={254} name="email" required type="email" />
      </label>
      <label className="block space-y-2 text-sm font-medium text-plum" htmlFor="admin-password">
        Password
        <Input autoComplete="current-password" id="admin-password" maxLength={128} name="password" required type="password" />
      </label>
      <Button className="w-full" disabled={submitting || !firebaseConfigured} type="submit">
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
