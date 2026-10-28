"use client";

import { useState, type FormEvent } from "react";
import { Check, Sparkles } from "lucide-react";

type SignupState = { kind: "success" | "error"; message: string } | null;

export function NewsletterBanner() {
  const [state, setState] = useState<SignupState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setState(null);
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          consent: formData.get("consent") === "on",
        }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setState({
          kind: "error",
          message: result.error ?? "We could not subscribe you right now. Please try again.",
        });
        return;
      }
      setState({
        kind: "success",
        message: result.message ?? "Thanks for subscribing.",
      });
      form.reset();
    } catch {
      setState({
        kind: "error",
        message: "We could not subscribe you right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="newsletter-title" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-gold/30 bg-[#35162c] shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 sm:p-9 lg:p-12">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e5c57a]">
            <Sparkles aria-hidden="true" className="size-4" />
            A little note from Shringaar
          </p>
          <h2
            className="font-display mt-3 max-w-xl text-3xl leading-tight text-[#f0d78c] sm:text-4xl"
            id="newsletter-title"
          >
            A little Shringaar, in your inbox
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">
            Join our list for new arrivals, thoughtful edits, and occasional
            notes from the world of Shringaar.
          </p>
        </div>
        <div className="flex flex-col justify-center border-t border-white/15 bg-white/[0.04] p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-10">
          <form className="space-y-3" onSubmit={subscribe}>
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                autoComplete="email"
                className="min-h-12 min-w-0 flex-1 rounded-control border border-white/30 bg-white px-4 text-sm text-plum outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-[#e5c57a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#35162c]"
                id="newsletter-email"
                maxLength={254}
                name="email"
                placeholder="Your email address"
                required
                type="email"
              />
              <button
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-control bg-[#e5c57a] px-5 text-sm font-semibold text-plum transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#35162c] disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Subscribing…" : "Subscribe"}
                {!isSubmitting && <Check aria-hidden="true" className="size-4" />}
              </button>
            </div>
            <label className="flex min-h-11 items-start gap-2 text-xs leading-5 text-white/75">
              <input
                className="mt-1 size-4 shrink-0 accent-[#e5c57a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                name="consent"
                required
                type="checkbox"
              />
              <span>
                I agree to receive occasional email updates from Shringaar.
              </span>
            </label>
            <p className="text-[11px] leading-5 text-white/60">
              Your email address is used only for Shringaar updates.
            </p>
            {state && (
              <p
                aria-live="polite"
                className={`text-sm ${state.kind === "success" ? "text-[#d4f0df]" : "text-[#ffd8d8]"}`}
                role={state.kind === "error" ? "alert" : "status"}
              >
                {state.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
