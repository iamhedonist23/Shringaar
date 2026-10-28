import type { Metadata } from "next";
import { AccountPageShell } from "@/components/account/page-shell";
import { AddressBook } from "@/components/account/address-book";
import { requireCustomerPage } from "@/lib/customer-auth";
import { listCustomerAddresses } from "@/lib/repositories/customer.repository";

export const metadata: Metadata = { title: "Saved addresses" };
export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  const session = await requireCustomerPage("/account/addresses");
  const addresses = await listCustomerAddresses(session.user.id);
  return (
    <AccountPageShell name={session.user.name} title="Saved addresses">
      <AddressBook initialAddresses={addresses} />
    </AccountPageShell>
  );
}
