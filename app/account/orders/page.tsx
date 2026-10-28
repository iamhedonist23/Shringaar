import type { Metadata } from "next";
import { AccountPageShell } from "@/components/account/page-shell";
import { requireCustomerPage } from "@/lib/customer-auth";
import { listCustomerOrders } from "@/lib/repositories/order.repository";

export const metadata: Metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const session = await requireCustomerPage("/account/orders");
  const orders = await listCustomerOrders(session.user.id, 50);

  return (
    <AccountPageShell name={session.user.name} title="Your orders">
      {orders.length === 0 ? (
        <section className="rounded-card border border-border bg-white p-6 shadow-card">
          <h2 className="font-display text-2xl text-plum">No account orders yet</h2>
          <p className="mt-2 text-sm text-muted">Orders placed as a guest are not automatically attached to this account.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article className="rounded-card border border-border bg-white p-5 shadow-card" key={order.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-plum">Order {order.orderNumber}</h2>
                  <p className="mt-1 text-xs text-muted">{order.createdAt.toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-plum">₹{order.total.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-muted">{order.status.toLowerCase()} · payment {order.paymentStatus.toLowerCase()}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-1 border-t border-border pt-3 text-sm text-muted">
                {order.items.map((item, index) => <li key={`${item.productName}-${index}`}>{item.productName} — {item.variantName}, Qty {item.quantity}</li>)}
              </ul>
            </article>
          ))}
        </div>
      )}
    </AccountPageShell>
  );
}
