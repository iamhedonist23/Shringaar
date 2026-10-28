"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  confirmPasswordReset,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { LoginModal } from "@/components/account/login-modal";
import { useToast } from "@/components/ui/toast";
import { auth, firebaseConfigured, googleProvider } from "@/lib/firebase";
import { safeReturnPath } from "@/lib/return-to";

export type CustomerAuthUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

type AuthContextValue = {
  user: CustomerAuthUser | null;
  loading: boolean;
  googleSignInEnabled: boolean;
  openLogin: (returnTo?: string, trigger?: HTMLElement | (() => void)) => void;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (code: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function firebaseErrorCode(error: unknown) {
  return error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code.toLowerCase()
    : "";
}

function friendlyAuthError(error: unknown) {
  const code = firebaseErrorCode(error);
  if (code.includes("account-exists-with-different-credential")) {
    return "An account already uses this email. Sign in with your existing method first.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many sign-in attempts. Please wait a moment and try again.";
  }
  if (code.includes("network-request-failed")) {
    return "A network error interrupted sign-in. Check your connection and try again.";
  }
  if (code.includes("email-already-in-use")) {
    return "An account already exists for this email. Sign in instead.";
  }
  if (code.includes("invalid-credential") || code.includes("user-not-found") || code.includes("wrong-password")) {
    return "Email or password is incorrect. Please try again.";
  }
  if (code.includes("weak-password")) {
    return "Choose a stronger password with at least 12 characters.";
  }
  return error instanceof Error ? error.message : "Authentication could not be completed. Please try again.";
}

function toCustomerUser(user: FirebaseUser): CustomerAuthUser {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "Shringaar customer",
    email: user.email || "",
    image: user.photoURL,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<CustomerAuthUser | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [loginOpen, setLoginOpen] = useState(false);
  const [returnTo, setReturnTo] = useState("/account");
  const returnFocusRef = useRef<HTMLElement | (() => void) | null>(null);
  const sessionSyncRef = useRef(new Map<string, Promise<void>>());

  const syncServerSession = useCallback((firebaseUser: FirebaseUser) => {
    const activeSync = sessionSyncRef.current.get(firebaseUser.uid);
    if (activeSync) return activeSync;

    const sync = (async () => {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(result?.error || "Your sign-in session could not be verified.");
      }
    })();

    sessionSyncRef.current.set(firebaseUser.uid, sync);
    void sync.finally(() => {
      if (sessionSyncRef.current.get(firebaseUser.uid) === sync) {
        sessionSyncRef.current.delete(firebaseUser.uid);
      }
    }).catch(() => undefined);
    return sync;
  }, []);

  const notifySuccessfulSignIn = useCallback((firebaseUser: FirebaseUser) => {
    const action = window.sessionStorage.getItem("shringaar-firebase-sign-in-pending");
    if (!action) return;
    window.sessionStorage.removeItem("shringaar-firebase-sign-in-pending");
    const firstName = toCustomerUser(firebaseUser).name.trim().split(/\s+/)[0] || "there";
    toast(action === "register"
      ? `Welcome to Shringaar, ${firstName}.`
      : `Welcome back, ${firstName}.`);
  }, [toast]);

  useEffect(() => {
    if (!auth) return;

    let active = true;
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!active) return;
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (!firebaseUser.emailVerified) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await syncServerSession(firebaseUser);
        if (!active) return;
        setUser(toCustomerUser(firebaseUser));
        notifySuccessfulSignIn(firebaseUser);
      } catch (error) {
        if (!active) return;
        setUser(null);
        toast(
          error instanceof Error
            ? error.message
            : "Your sign-in could not be verified. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    });

    void getRedirectResult(auth).catch((error: unknown) => {
      const code = firebaseErrorCode(error);
      if (code.includes("popup-closed-by-user")) return;
      window.sessionStorage.removeItem("shringaar-firebase-sign-in-pending");
      toast(friendlyAuthError(error));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [notifySuccessfulSignIn, syncServerSession, toast]);

  const openLogin = useCallback(
    (nextPath = pathname || "/account", trigger?: HTMLElement | (() => void)) => {
      setReturnTo(safeReturnPath(nextPath));
      returnFocusRef.current = trigger ?? null;
      setLoginOpen(true);
    },
    [pathname],
  );
  const handleLoginOpenChange = useCallback((open: boolean) => {
    setLoginOpen(open);
    if (!open) {
      const returnFocus = returnFocusRef.current;
      window.requestAnimationFrame(() => {
        if (typeof returnFocus === "function") returnFocus();
        else returnFocus?.focus();
      });
    }
  }, []);

  const signInWithGoogle = useCallback(
    async (nextPath = returnTo) => {
      if (!auth || !googleProvider) {
        throw new Error("Firebase sign-in is not configured yet.");
      }
      window.sessionStorage.setItem("shringaar-firebase-sign-in-pending", "login");
      try {
        const credential = await signInWithPopup(auth, googleProvider);
        if (!credential.user.emailVerified) {
          throw new Error("Verify your Google account email before continuing.");
        }
        await syncServerSession(credential.user);
        setUser(toCustomerUser(credential.user));
        setLoginOpen(false);
        router.replace(safeReturnPath(nextPath));
        router.refresh();
      } catch (error) {
        const code = firebaseErrorCode(error);
        if (code.includes("popup-closed-by-user")) {
          window.sessionStorage.removeItem("shringaar-firebase-sign-in-pending");
          return;
        }
        if (code.includes("popup-blocked")) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        window.sessionStorage.removeItem("shringaar-firebase-sign-in-pending");
        throw new Error(friendlyAuthError(error));
      }
    },
    [returnTo, router, syncServerSession],
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase sign-in is not configured yet.");
    window.sessionStorage.setItem("shringaar-firebase-sign-in-pending", "login");
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        await firebaseSignOut(auth);
        window.sessionStorage.removeItem("shringaar-firebase-sign-in-pending");
        throw new Error("Please verify your email using the link we sent before signing in.");
      }
      await syncServerSession(credential.user);
      setUser(toCustomerUser(credential.user));
      setLoginOpen(false);
    } catch (error) {
      window.sessionStorage.removeItem("shringaar-firebase-sign-in-pending");
      throw new Error(friendlyAuthError(error));
    }
  }, [syncServerSession]);

  const registerWithEmail = useCallback(async (
    email: string,
    password: string,
    name: string,
  ) => {
    if (!auth) throw new Error("Firebase sign-in is not configured yet.");
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await sendEmailVerification(credential.user);
      await firebaseSignOut(auth);
    } catch (error) {
      throw new Error(friendlyAuthError(error));
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!auth) throw new Error("Firebase sign-in is not configured yet.");
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
      });
    } catch (error) {
      throw new Error(friendlyAuthError(error));
    }
  }, []);

  const resetPassword = useCallback(async (code: string, password: string) => {
    if (!auth) throw new Error("Firebase sign-in is not configured yet.");
    try {
      await confirmPasswordReset(auth, code, password);
    } catch (error) {
      throw new Error(friendlyAuthError(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (auth) {
      const response = await fetch("/api/auth/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not clear the secure session. Please try again.");
      await firebaseSignOut(auth);
    }
    window.sessionStorage.removeItem("shringaar-firebase-sign-in-pending");
    setUser(null);
    toast("You’ve signed out of Shringaar.");
    router.refresh();
  }, [router, toast]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      googleSignInEnabled: firebaseConfigured,
      openLogin,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      requestPasswordReset,
      resetPassword,
      signOut,
    }),
    [
      loading,
      openLogin,
      registerWithEmail,
      requestPasswordReset,
      resetPassword,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      user,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        onOpenChange={handleLoginOpenChange}
        open={loginOpen}
        returnTo={returnTo}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
