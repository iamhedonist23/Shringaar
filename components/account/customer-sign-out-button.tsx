"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function CustomerSignOutButton() {
  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    setError(null);
    try {
      await signOut();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        className="min-h-11 rounded-control border border-border bg-white px-4 text-sm font-semibold text-plum hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
        disabled={pending}
        onClick={() => void handleSignOut()}
        type="button"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <p className="mt-2 text-sm text-error" role="alert">{error}</p>}
    </div>
  );
}
