import type { Metadata } from "next";
import { CartPage } from "@/components/storefront/cart-page";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";

export const metadata: Metadata = { title: "Shopping bag" };

export default function CartRoute() {
  return (
    <>
      <SiteHeader categories={[]} />
      <CartPage />
      <SiteFooter />
    </>
  );
}
