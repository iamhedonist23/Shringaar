"use client";

import Image from "next/image";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/account/google-sign-in-button";
import { Modal } from "@/components/ui/modal";

export function LoginModal({
  open,
  onOpenChange,
  returnTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnTo: string;
}) {
  return (
    <Modal
      className="login-modal-content"
      description="Sign in to save your wishlist and track your orders."
      onOpenChange={onOpenChange}
      open={open}
      title="Welcome to Shringaar"
    >
      <div className="flex flex-col items-center text-center">
        <Image
          alt="Shringaar"
          className="mb-4 h-10 w-32 object-contain"
          height={572}
          src="/images/shringaar-logo.png"
          width={1414}
        />
        <GoogleSignInButton returnTo={returnTo} />
        <p className="mt-5 text-xs leading-5 text-muted">
          By continuing you agree to our Terms &amp; Privacy Policy.
        </p>
        <p className="mt-4 text-sm text-muted">
          Prefer email?{" "}
          <Link
            className="font-semibold text-plum underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Sign in with email
          </Link>
        </p>
      </div>
    </Modal>
  );
}
