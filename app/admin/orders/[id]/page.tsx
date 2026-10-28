import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { OrderFulfillmentControl } from "@/components/admin/order-fulfillment-control";
import { UroPayStatusRefresh } from "@/components/admin/uropay-status-refresh";
import { isUroPayEnabled } from "@/lib/commerce-config";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { adminIdSchema } from "@/lib/admin-schemas";
import { getAdminOrderDetails } from "@/lib/repositories/order.repository";

export const metadata: Metadata = { title: "Order details" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const parsedId = adminIdSchema.safeParse(id);
  if (!parsedId.success) notFound();
  const result = await getAdminOrderDetails(parsedId.data);
  if (!result) notFound();
  const { order, auditLog } = result;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link className="text-sm text-plum underline" href="/admin/orders">← Orders</Link>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-contrast">Order details</p>
          <h1 className="font-display mt-2 text-4xl text-plum">{order.orderNumber}</h1>
        </div>
        <div className="text-sm text-muted">{order.createdAt.toLocaleString("en-IN")}</div>
      </header>
      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-card border border-border bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl text-plum">Items</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead><tr className="border-b border-border text-muted"><th className="py-2">Product snapshot</th><th>SKU</th><th>Unit price</th><th>Qty</th><th>Line total</th></tr></thead>
                <tbody>{order.items.map((item) => (
                  <tr className="border-b border-border/70" key={item.id}>
                    <td className="py-3 font-medium text-plum">{item.productName}<span className="block text-xs text-muted">{item.variantName}</span></td>
                    <td>{item.sku}</td><td>₹{item.unitPrice.toFixed(2)}</td><td>{item.quantity}</td><td>₹{item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
          <section className="rounded-card border border-border bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl text-plum">Audit trail</h2>
            {auditLog.length === 0 ? <p className="mt-3 text-sm text-muted">No admin changes recorded yet.</p> : (
              <ol className="mt-4 space-y-4">
                {auditLog.map((entry) => (
                  <li className="border-l-2 border-gold/50 pl-4" key={entry.id}>
                    <p className="text-sm font-medium text-plum">{entry.action} · {entry.actor.name} ({entry.actor.email})</p>
                    <time className="mt-1 block text-xs text-muted" dateTime={entry.createdAt.toISOString()}>{entry.createdAt.toLocaleString("en-IN")}</time>
                    <pre className="mt-2 overflow-x-auto rounded-control bg-ivory p-3 text-xs text-plum">{JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}</pre>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
        <aside className="space-y-5">
          <section className="space-y-4 rounded-card border border-border bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl text-plum">Order status</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Fulfilment</dt><dd className="font-semibold text-plum">{order.status}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Payment</dt><dd className="font-semibold text-plum">{order.paymentStatus} · {order.paymentMethod}</dd></div>
            </dl>
            <OrderStatusControl orderId={order.id} status={order.status} />
            {order.paymentMethod === "UROPAY" && isUroPayEnabled() && (
              <UroPayStatusRefresh orderId={order.id} />
            )}
          </section>
          <section className="rounded-card border border-border bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl text-plum">Customer & delivery</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-muted">Name</dt><dd className="font-medium text-plum">{order.customerName}</dd></div>
              <div><dt className="text-muted">Email</dt><dd className="break-all font-medium text-plum">{order.customerEmail}</dd></div>
              <div><dt className="text-muted">Phone</dt><dd className="font-medium text-plum">{order.customerPhone}</dd></div>
              <div><dt className="text-muted">Address</dt><dd className="font-medium leading-6 text-plum">{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />{order.city}, {order.state} {order.postalCode}<br />{order.country}</dd></div>
            </dl>
          </section>
          <section className="rounded-card border border-border bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl text-plum">Manual fulfilment</h2>
            <p className="mt-1 text-sm text-muted">Update dispatch progress and the delivery details without a courier integration.</p>
            <div className="mt-4">
              <OrderFulfillmentControl
                orderId={order.id}
                fulfillment={{
                  shipmentStatus: order.shipmentStatus,
                  trackingNumber: order.trackingNumber,
                  carrierName: order.carrierName,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  addressLine1: order.addressLine1,
                  addressLine2: order.addressLine2,
                  city: order.city,
                  state: order.state,
                  postalCode: order.postalCode,
                  country: order.country,
                }}
              />
            </div>
          </section>
          <section className="rounded-card border border-border bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl text-plum">Totals</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>₹{order.subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>₹{order.shippingAmount.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd>₹{order.taxAmount.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>₹{order.discountAmount.toFixed(2)}</dd></div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-plum"><dt>Total</dt><dd>₹{order.total.toFixed(2)}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}
