import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Facebook,
  Instagram,
  MessageCircle,
  Youtube,
} from "lucide-react";
import { BackToTop } from "@/components/storefront/back-to-top";
import {
  contactEmail,
  footerLinkGroups,
  socialPlatforms,
} from "@/data/storefront-bottom";

function safeExternalUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function SocialIcon({ label }: { label: string }) {
  const className = "size-4";
  switch (label) {
    case "Instagram":
      return <Instagram aria-hidden="true" className={className} />;
    case "Facebook":
      return <Facebook aria-hidden="true" className={className} />;
    case "YouTube":
      return <Youtube aria-hidden="true" className={className} />;
    case "WhatsApp":
      return <MessageCircle aria-hidden="true" className={className} />;
    default:
      return <span aria-hidden="true" className="text-sm font-semibold">P</span>;
  }
}

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <section className="min-w-0">
      <h2 className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e5c57a] lg:block">
        {title}
      </h2>
      <details className="group lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between border-b border-white/15 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e5c57a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5c57a] [&::-webkit-details-marker]:hidden">
          {title}
          <span aria-hidden="true" className="text-lg leading-none transition group-open:rotate-45">+</span>
        </summary>
        <ul className="space-y-1 py-2">
          {links.map((link) => (
            <li key={link.href}>
              <FooterLink href={link.href}>{link.label}</FooterLink>
            </li>
          ))}
        </ul>
      </details>
      <ul className="mt-3 hidden space-y-0 lg:block">
        {links.map((link) => (
          <li key={link.href}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      className="group/link inline-flex min-h-11 items-center py-2 text-sm text-white/75 transition-colors hover:text-[#f0d78c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5c57a] lg:min-h-8 lg:py-1"
      href={href}
    >
      <span className="relative">
        {children}
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[#e5c57a] transition-transform duration-200 group-hover/link:scale-x-100"
        />
      </span>
    </Link>
  );
}

export function SiteFooter() {
  const socials = socialPlatforms
    .map((social) => ({
      ...social,
      href: safeExternalUrl(process.env[social.env]),
    }))
    .filter((social) => social.href);
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || contactEmail;
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  const businessHours = process.env.NEXT_PUBLIC_BUSINESS_HOURS?.trim();
  const businessAddress = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS?.trim();

  return (
    <footer className="relative border-t border-[#c6a65b]/70 bg-[#35162c] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-5 gap-y-8 px-4 py-9 sm:px-6 sm:py-11 lg:grid-cols-12 lg:gap-6 lg:px-8 lg:py-12">
        <div className="col-span-2 lg:col-span-3">
          <Link
            aria-label="Shringaar home"
            className="inline-flex w-fit items-center rounded-xl bg-ivory px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5c57a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#35162c]"
            href="/"
          >
            <Image
              alt=""
              className="h-14 w-36 object-contain"
              height={572}
              src="/images/shringaar-logo.png"
              width={1414}
            />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">
            Imitation jewellery for the little details and lasting moments.
          </p>
          {socials.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e5c57a]">
                Find us online
              </p>
              <ul aria-label="Social media" className="mt-3 flex flex-wrap gap-2">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      aria-label={social.label}
                      className="grid size-10 place-items-center rounded-full border border-[#e5c57a]/60 text-[#f0d78c] transition hover:bg-[#e5c57a] hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      href={social.href!}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <SocialIcon label={social.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {footerLinkGroups.map((group) => (
          <div className="col-span-1 lg:col-span-2" key={group.title}>
            <FooterLinkGroup links={group.links} title={group.title} />
          </div>
        ))}

        <section className="col-span-2 border-t border-white/15 pt-5 lg:col-span-3 lg:border-0 lg:pt-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e5c57a]">
            Need a hand?
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">
            Manage your orders and saved delivery details from your account.
          </p>
          {supportEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail) ? (
            <a
              className="mt-2 inline-flex min-h-10 items-center text-sm text-white/80 underline decoration-white/30 underline-offset-4 hover:text-[#f0d78c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5c57a]"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
          ) : null}
          {supportPhone && (
            <a
              className="mt-1 flex min-h-10 items-center text-sm text-white/80 underline decoration-white/30 underline-offset-4 hover:text-[#f0d78c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5c57a]"
              href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`}
            >
              {supportPhone}
            </a>
          )}
          {businessHours && (
            <p className="mt-2 text-xs leading-5 text-white/60">{businessHours}</p>
          )}
          {businessAddress && (
            <address className="mt-2 not-italic text-xs leading-5 text-white/60">
              {businessAddress}
            </address>
          )}
          {!supportEmail && !supportPhone && !businessHours && !businessAddress ? (
            <Link
              className="mt-2 inline-flex min-h-10 items-center text-sm text-white/80 underline decoration-white/30 underline-offset-4 hover:text-[#f0d78c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5c57a]"
              href="/account/orders"
            >
              Visit your account
              <ArrowUpRight aria-hidden="true" className="ml-1 size-3.5" />
            </Link>
          ) : null}
        </section>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 text-xs text-white/70 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Shringaar</p>
          <ul aria-label="Accepted payment methods" className="flex flex-wrap gap-2">
            {["UPI", "Cards", "COD"].map((method) => (
              <li
                className="rounded border border-white/20 px-2.5 py-1 font-medium text-white/80"
                key={method}
              >
                {method}
              </li>
            ))}
          </ul>
          <p className="max-w-md leading-5 lg:text-right">
            Shipping charges are ₹99 on orders of ₹499 or less, and free above
            ₹499. See your cart for the current order total.
          </p>
        </div>
      </div>
      <BackToTop />
    </footer>
  );
}
