import type { Metadata } from "next";
import Link from "next/link";
import { AccountPageShell } from "@/components/account/page-shell";
import { CustomerSignOutButton } from "@/components/account/customer-sign-out-button";
import { requireCustomerPage } from "@/lib/customer-auth";
import { listCustomerAddresses } from "@/lib/repositories/customer.repository";
import { listCustomerOrders } from "@/lib/repositories/order.repository";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireCustomerPage("/account");
  const [addresses, orders] = await Promise.all([
    listCustomerAddresses(session.user.id),
    listCustomerOrders(session.user.id),
  ]);
  const customer = session.user;
  const addressCount = addresses.length;
  const orderCount = orders.length;

  return (
    <AccountPageShell name={customer.name} title="Account overview">
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-card border border-border bg-white p-6 shadow-card">
          <h2 className="font-display text-2xl text-plum">Account details</h2>
          <p className="mt-4 text-sm text-muted">Email</p>
          <p className="font-medium text-plum">{customer.email}</p>
          <CustomerSignOutButton />
        </section>
        <section className="rounded-card border border-border bg-white p-6 shadow-card">
          <h2 className="font-display text-2xl text-plum">Saved details</h2>
          <div className="mt-4 flex justify-between text-sm"><span>Addresses</span><span className="font-semibold text-plum">{addressCount}</span></div>
          <div className="mt-2 flex justify-between text-sm"><span>Orders</span><span className="font-semibold text-plum">{orderCount}</span></div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="min-h-11 rounded-control bg-plum px-4 py-3 text-sm font-semibold text-white" href="/account/addresses">Manage addresses</Link>
            <Link className="min-h-11 rounded-control border border-border px-4 py-3 text-sm font-semibold text-plum" href="/account/orders">View orders</Link>
          </div>
        </section>
      </div>
    </AccountPageShell>
  );
}
