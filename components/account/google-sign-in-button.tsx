"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function GoogleSignInButton({
  returnTo = "/account",
}: {
  returnTo?: string;
}) {
  const { googleSignInEnabled, signInWithGoogle } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setPending(true);
    try {
      await signInWithGoogle(returnTo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-in could not be completed.");
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        className="w-full border border-border bg-white text-plum hover:bg-ivory"
        disabled={!googleSignInEnabled || pending}
        onClick={() => void handleSignIn()}
        type="button"
        variant="secondary"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <GoogleMark />
        )}
        {pending ? "Connecting to Google…" : "Continue with Google"}
      </Button>
      {!googleSignInEnabled && (
        <p className="mt-2 text-center text-xs text-muted" role="status">
          Firebase Authentication is not configured yet.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 48 48">
      <path fill="#4285F4" d="M43.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.1c-.5 2.8-2.1 5.2-4.5 6.8l7.2 5.6c4.2-3.9 6.6-9.6 6.6-16.4Z" />
      <path fill="#34A853" d="M24 44c5.9 0 10.8-2 14.4-5.3l-7.2-5.6c-2 1.3-4.4 2.1-7.2 2.1-5.5 0-10.2-3.7-11.9-8.7l-7.4 5.7C8.4 39.2 15.6 44 24 44Z" />
      <path fill="#FBBC05" d="M12.1 26.5a12 12 0 0 1 0-5l-7.4-5.7a20 20 0 0 0 0 16.4l7.4-5.7Z" />
      <path fill="#EA4335" d="M24 12.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 6.2 29.9 4 24 4 15.6 4 8.4 8.8 4.7 15.8l7.4 5.7c1.7-5 6.4-8.7 11.9-8.7Z" />
    </svg>
  );
}
