import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { listContactMessages } from "@/lib/repositories/contact-message.repository";

export const metadata: Metadata = { title: "Contact messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdminPage();
  const messages = await listContactMessages();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <Link className="text-sm text-plum underline" href="/admin">
          ← Admin dashboard
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-contrast">
              Customer support
            </p>
            <h1 className="font-display mt-2 text-4xl text-plum">
              Contact messages
            </h1>
          </div>
          <p className="text-sm text-muted">
            {messages.length === 100 ? "Latest 100 messages" : `${messages.length} messages`}
          </p>
        </div>
      </header>

      {messages.length === 0 ? (
        <section className="mt-7 rounded-card border border-border bg-white p-8 text-center shadow-card">
          <h2 className="font-display text-2xl text-plum">No messages yet</h2>
          <p className="mt-2 text-sm text-muted">
            Contact form submissions will appear here.
          </p>
        </section>
      ) : (
        <ol className="mt-7 space-y-4">
          {messages.map((message) => (
            <li
              className="rounded-card border border-border bg-white p-5 shadow-card sm:p-6"
              key={message.id}
            >
              <article>
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-plum">{message.name}</h2>
                    <a
                      className="mt-1 inline-block break-all text-sm text-plum underline decoration-gold/60 underline-offset-4"
                      href={`mailto:${message.email}`}
                    >
                      {message.email}
                    </a>
                  </div>
                  <time
                    className="text-xs text-muted"
                    dateTime={message.createdAt.toISOString()}
                  >
                    {message.createdAt.toLocaleString("en-IN")}
                  </time>
                </header>
                {message.orderNumber && (
                  <p className="mt-4 text-sm">
                    <span className="text-muted">Order number: </span>
                    <span className="font-medium text-plum">{message.orderNumber}</span>
                  </p>
                )}
                <p className="mt-4 whitespace-pre-wrap break-words border-t border-border pt-4 text-sm leading-6 text-ink">
                  {message.message}
                </p>
              </article>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
