import type { Metadata } from "next";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import {
  isCashOnDeliveryEnabled,
  isUroPayEnabled,
} from "@/lib/commerce-config";
import { requireCustomerPage, ensureCustomerProfile } from "@/lib/customer-auth";
import { listCustomerAddresses } from "@/lib/repositories/customer.repository";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutRoute() {
  const session = await requireCustomerPage("/checkout");
  const customer = await ensureCustomerProfile(session.user);
  const addresses = await listCustomerAddresses(customer.id);
  return (
    <>
      <SiteHeader categories={[]} />
      <main>
        <CheckoutForm
          cashOnDeliveryEnabled={isCashOnDeliveryEnabled()}
          uroPayEnabled={isUroPayEnabled()}
          customer={customer}
          addresses={addresses}
        />
      </main>
      <SiteFooter />
    </>
  );
}
