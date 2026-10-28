import type { Metadata } from "next";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { UroPayPaymentResult } from "@/components/storefront/uropay-payment-result";

export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
};

export default async function UroPayPaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  return (
    <>
      <SiteHeader categories={[]} />
      <main className="min-h-[55vh] px-4">
        <UroPayPaymentResult token={token} />
      </main>
      <SiteFooter />
    </>
  );
}
