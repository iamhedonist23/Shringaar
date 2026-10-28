import type { Metadata } from "next";
import { ArrowRight, Mail } from "lucide-react";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ContactForm } from "@/components/storefront/contact-form";
import { listCategories } from "@/lib/catalog";
import { contactEmail } from "@/data/storefront-bottom";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Shringaar for help with your order or jewellery.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  try {
    categories = await listCategories();
  } catch (error) {
    console.error("Contact page categories could not be loaded:", error);
  }

  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent("Hello, Shringaar")}`;

  return (
    <StorefrontShell categories={categories}>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-contrast">
            We’re here to help
          </p>
          <h1 className="font-display mt-3 text-4xl text-plum sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Have a question about an order or a piece you love? Send us an email
            and our team will be happy to help.
          </p>
        </header>

        <section
          aria-labelledby="contact-email-heading"
          className="mt-8 rounded-card border border-border bg-white p-6 shadow-card sm:mt-10 sm:p-8"
        >
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ivory text-gold-contrast">
              <Mail aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-2xl text-plum" id="contact-email-heading">
                Email us
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                For order questions, please include your order number so we can
                assist you faster.
              </p>
              <a
                className="mt-4 inline-flex min-h-11 max-w-full items-center gap-2 break-all rounded-control font-semibold text-plum underline decoration-gold/60 underline-offset-4 hover:text-gold-contrast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                href={mailto}
              >
                {contactEmail}
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </a>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="contact-form-heading"
          className="mt-6 rounded-card border border-border bg-white p-6 shadow-card sm:p-8"
        >
          <h2 className="font-display text-2xl text-plum" id="contact-form-heading">
            Send us a message
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Share a few details and we’ll reply to the email address you provide.
          </p>
          <ContactForm />
        </section>
      </div>
    </StorefrontShell>
  );
}
