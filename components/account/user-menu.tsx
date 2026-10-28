"use client";

// OAuth profile image URLs are dynamic and are rendered without the Next.js optimizer.
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, UserRound } from "lucide-react";
import { useAuth, type CustomerAuthUser } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";

export function CustomerAccountControl() {
  const { loading, user, openLogin } = useAuth();

  if (loading) {
    return (
      <span
        aria-label="Checking account"
        aria-busy="true"
        className="skeleton-shimmer grid size-11 shrink-0 place-items-center rounded-full"
        role="status"
      />
    );
  }

  if (!user) {
    return (
      <button
        aria-label="Sign in to your account"
        className="grid size-11 shrink-0 place-items-center rounded-full text-plum hover:bg-plum/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        onClick={(event) => openLogin(undefined, event.currentTarget)}
        type="button"
      >
        <UserRound aria-hidden="true" className="size-5" />
      </button>
    );
  }

  return <UserMenu user={user} />;
}

function UserMenu({ user }: { user: CustomerAuthUser }) {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const reduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
    function dismissOutside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [open]);

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ),
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setOpen(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name}`}
        className="flex min-h-11 items-center gap-1 rounded-full p-1 text-plum hover:bg-plum/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        <Avatar key={user.image ?? user.id} user={user} />
        <ChevronDown aria-hidden="true" className="mr-1 hidden size-3.5 sm:block" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-card border border-border bg-white p-2 shadow-card"
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            onKeyDown={handleMenuKeyDown}
            ref={menuRef}
            role="menu"
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <div className="border-b border-border px-3 py-3">
              <p className="truncate text-sm font-semibold text-plum">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <MenuLink href="/account/orders" onNavigate={() => setOpen(false)}>My Orders</MenuLink>
            <span
              aria-disabled="true"
              className="flex min-h-10 items-center justify-between rounded-control px-3 text-sm text-muted/70"
              role="menuitem"
              tabIndex={-1}
            >
              Wishlist <span className="text-[10px] uppercase tracking-wide">Coming soon</span>
            </span>
            <MenuLink href="/account" onNavigate={() => setOpen(false)}>Account Settings</MenuLink>
            <button
              className="min-h-10 w-full rounded-control px-3 text-left text-sm text-error hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
              role="menuitem"
              type="button"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileAccountLinks({
  onNavigate,
  returnFocusTarget,
}: {
  onNavigate: () => void;
  returnFocusTarget: () => void;
}) {
  const { loading, user, openLogin, signOut } = useAuth();
  const { toast } = useToast();

  async function handleSignOut() {
    try {
      await signOut();
      onNavigate();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not sign out. Please try again.");
    }
  }

  return (
    <section aria-label="Your account" className="mt-4 border-t border-border pt-4">
      {loading ? (
        <p className="px-3 py-2 text-sm text-muted" role="status">Checking your account…</p>
      ) : user ? (
        <>
          <div className="flex items-center gap-3 px-3 pb-3">
            <Avatar key={user.image ?? user.id} user={user} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-plum">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <MobileLink href="/account/orders" onNavigate={onNavigate}>My Orders</MobileLink>
          <span aria-disabled="true" className="flex min-h-11 items-center justify-between px-3 text-sm text-muted/70">
            Wishlist <span className="text-[10px] uppercase tracking-wide">Coming soon</span>
          </span>
          <MobileLink href="/account" onNavigate={onNavigate}>Account Settings</MobileLink>
          <button
            className="min-h-11 w-full rounded-control px-3 text-left text-sm font-medium text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            onClick={() => void handleSignOut()}
            type="button"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          className="min-h-11 w-full rounded-control px-3 text-left text-sm font-semibold text-plum hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          onClick={() => {
            onNavigate();
            openLogin(undefined, returnFocusTarget);
          }}
          type="button"
        >
          Sign in to your account
        </button>
      )}
    </section>
  );
}

function MenuLink({
  children,
  href,
  onNavigate,
}: {
  children: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      className="flex min-h-10 items-center rounded-control px-3 text-sm text-plum hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      href={href}
      onClick={onNavigate}
      role="menuitem"
      tabIndex={0}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  children,
  href,
  onNavigate,
}: {
  children: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      className="flex min-h-11 items-center rounded-control px-3 text-sm font-medium text-plum hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      href={href}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}

function Avatar({ user }: { user: CustomerAuthUser }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (user.image && !imageFailed) {
    return (
      <img
        alt=""
        className="size-9 rounded-full border border-gold/40 object-cover"
        height={36}
        onError={() => setImageFailed(true)}
        referrerPolicy="no-referrer"
        src={user.image}
        width={36}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-9 place-items-center rounded-full border border-gold/40 bg-ivory text-xs font-semibold text-plum"
    >
      {initials || <UserRound className="size-4" />}
    </span>
  );
}
