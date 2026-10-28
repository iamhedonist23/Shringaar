"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GoogleSignInButton } from "@/components/account/google-sign-in-button";
import { useAuth } from "@/context/AuthContext";
import { firebaseConfigured } from "@/lib/firebase";
import { safeReturnPath } from "@/lib/return-to";

type AuthMode = "login" | "register" | "forgot" | "reset";

const copy: Record<AuthMode, { title: string; description: string; button: string }> = {
  login: {
    title: "Welcome back",
    description: "Sign in to view your Shringaar account and saved addresses.",
    button: "Sign in",
  },
  register: {
    title: "Create your account",
    description: "Save delivery addresses and keep your orders together.",
    button: "Create account",
  },
  forgot: {
    title: "Reset your password",
    description: "Enter your email and, if an account exists, we’ll send a reset link.",
    button: "Send reset link",
  },
  reset: {
    title: "Choose a new password",
    description: "Your reset link is valid for one hour.",
    button: "Update password",
  },
};

export function AuthForm({
  mode,
  token,
  returnTo = "/account",
  passwordResetComplete = false,
}: {
  mode: AuthMode;
  token?: string;
  returnTo?: string;
  passwordResetComplete?: boolean;
}) {
  const router = useRouter();
  const {
    signInWithEmail,
    registerWithEmail,
    requestPasswordReset,
    resetPassword,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();
    setPending(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        router.replace(safeReturnPath(returnTo));
        router.refresh();
      } else if (mode === "register") {
        await registerWithEmail(email, password, name);
        setMessage("Account created. Check your email and verify your address before signing in.");
      } else if (mode === "forgot") {
        await requestPasswordReset(email);
        setMessage("If an account exists for this email, a password reset link will be sent.");
      } else {
        if (!token) {
          setError("This reset link is invalid or expired. Request a new one.");
          return;
        }
        await resetPassword(token, password);
        router.replace("/login?passwordReset=1");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      setPending(false);
    }
  }

  const content = copy[mode];

  return (
    <section className="mx-auto my-10 w-full max-w-lg rounded-card border border-border bg-white p-6 shadow-card sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-contrast">Shringaar account</p>
      <h1 className="font-display mt-3 text-3xl text-plum sm:text-4xl">{content.title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{content.description}</p>
      {mode === "login" && passwordResetComplete && (
        <p className="mt-4 rounded-control bg-success/10 px-4 py-3 text-sm text-success" role="status">
          Your password has been updated. You can now sign in.
        </p>
      )}
      {!firebaseConfigured && (
        <p className="mt-4 rounded-control bg-ivory px-4 py-3 text-sm text-plum" role="status">
          Firebase Authentication is not configured for this site yet.
        </p>
      )}
      {mode === "login" && (
        <div className="mt-6">
          <GoogleSignInButton returnTo={returnTo} />
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            <span>or sign in with email</span>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}
      <form className="mt-7 space-y-4" onSubmit={submit}>
        {error && <p className="rounded-control bg-error/10 px-4 py-3 text-sm text-error" role="alert">{error}</p>}
        {message && <p className="rounded-control bg-success/10 px-4 py-3 text-sm text-success" role="status">{message}</p>}
        {(mode === "login" || mode === "register" || mode === "forgot") && (
          <label className="block text-sm font-medium text-plum" htmlFor="account-email">
            Email
            <input autoComplete="email" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" id="account-email" maxLength={254} name="email" required type="email" />
          </label>
        )}
        {mode === "register" && (
          <label className="block text-sm font-medium text-plum" htmlFor="account-name">
            Full name
            <input autoComplete="name" className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" id="account-name" maxLength={120} minLength={2} name="name" required />
          </label>
        )}
        {(mode === "login" || mode === "register" || mode === "reset") && (
          <label className="block text-sm font-medium text-plum" htmlFor="account-password">
            {mode === "reset" ? "New password" : "Password"}
            <input autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" id="account-password" maxLength={128} minLength={12} name="password" required type="password" />
          </label>
        )}
        {(mode === "register" || mode === "reset") && (
          <p className="text-xs leading-5 text-muted">Use at least 12 characters. Passwords are securely managed by Firebase Authentication.</p>
        )}
        <button className="min-h-12 w-full rounded-control bg-plum px-5 text-sm font-semibold text-white transition hover:bg-plum/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60" disabled={pending || !firebaseConfigured} type="submit">
          {pending ? "Please wait…" : content.button}
        </button>
      </form>
      <nav aria-label="Account access" className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-plum">
        {mode === "login" && (
          <>
            <Link className="underline underline-offset-4" href="/forgot-password">Forgot password?</Link>
            <Link className="underline underline-offset-4" href="/register">Create account</Link>
          </>
        )}
        {mode === "register" && <Link className="underline underline-offset-4" href="/login">Already have an account? Sign in</Link>}
        {mode === "forgot" && <Link className="underline underline-offset-4" href="/login">Back to sign in</Link>}
        {mode === "reset" && <Link className="underline underline-offset-4" href="/forgot-password">Request a new reset link</Link>}
      </nav>
    </section>
  );
}
