"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export function AdminSignOutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignOut() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", { method: "DELETE" });
      if (!response.ok) {
        setError("Sign out could not be completed. Please try again.");
        return;
      }
      if (auth) await firebaseSignOut(auth);
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Could not connect to the sign-out service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        className="min-h-11 rounded-control border border-border bg-white px-4 text-sm font-semibold text-plum"
        disabled={submitting}
        onClick={() => void handleSignOut()}
        type="button"
      >
        {submitting ? "Signing out…" : "Sign out"}
      </button>
      {error && <p className="mt-1 max-w-44 text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}
