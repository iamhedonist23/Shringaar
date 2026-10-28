"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState = { kind: "success" | "error"; message: string } | null;

export function ContactForm() {
  const [state, setState] = useState<FormState>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setState(null);
    setSubmitting(true);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          orderNumber: data.get("orderNumber"),
          message: data.get("message"),
          website: data.get("website"),
        }),
      });
      const result: unknown = await response.json();
      const message = result && typeof result === "object" && "message" in result &&
        typeof result.message === "string"
        ? result.message
        : "Your message could not be sent. Please try again.";
      if (!response.ok) {
        const error = result && typeof result === "object" && "error" in result &&
          typeof result.error === "string"
          ? result.error
          : message;
        setState({ kind: "error", message: error });
        return;
      }

      setState({ kind: "success", message });
      form.reset();
    } catch {
      setState({
        kind: "error",
        message: "We couldn’t connect to the contact service. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-plum">
          Your name
          <Input autoComplete="name" maxLength={100} name="name" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-plum">
          Email address
          <Input autoComplete="email" maxLength={254} name="email" required type="email" />
        </label>
      </div>
      <label className="block space-y-2 text-sm font-medium text-plum">
        Order number <span className="font-normal text-muted">(optional)</span>
        <Input autoComplete="off" maxLength={80} name="orderNumber" />
      </label>
      <label className="block space-y-2 text-sm font-medium text-plum">
        How can we help?
        <textarea
          className="min-h-36 w-full rounded-control border border-border bg-white p-3.5 text-sm text-ink outline-none transition placeholder:text-muted focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/20"
          maxLength={5000}
          minLength={10}
          name="message"
          placeholder="Write your message here…"
          required
        />
      </label>
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input autoComplete="off" name="website" tabIndex={-1} />
        </label>
      </div>
      <Button disabled={submitting} type="submit">
        {submitting ? "Sending…" : "Send message"}
        {!submitting && <ArrowRight aria-hidden="true" className="size-4" />}
      </Button>
      {state && (
        <p
          aria-live="polite"
          className={`text-sm ${state.kind === "success" ? "text-success" : "text-error"}`}
          role={state.kind === "error" ? "alert" : "status"}
        >
          {state.kind === "success" && <Check aria-hidden="true" className="mr-1 inline size-4" />}
          {state.message}
        </p>
      )}
    </form>
  );
}
