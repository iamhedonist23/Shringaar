import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { adminPageQuerySchema } from "@/lib/admin-schemas";
import { listAdminOrders } from "@/lib/repositories/order.repository";

export const metadata: Metadata = { title: "Orders" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminPage();
  const raw = await searchParams;
  const parsed = adminPageQuerySchema.safeParse({
    page: typeof raw.page === "string" ? raw.page : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    shipmentStatus: typeof raw.shipmentStatus === "string" ? raw.shipmentStatus : undefined,
    q: typeof raw.q === "string" ? raw.q : undefined,
  });
  const query = parsed.success ? parsed.data : { page: 1 };
  const { total, orders, totalPages } = await listAdminOrders(query);
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if ("status" in query && query.status) params.set("status", query.status);
    if ("shipmentStatus" in query && query.shipmentStatus) {
      params.set("shipmentStatus", query.shipmentStatus);
    }
    if ("q" in query && query.q) params.set("q", query.q);
    params.set("page", String(page));
    return `/admin/orders?${params.toString()}`;
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link className="text-sm text-plum underline" href="/admin">← Admin dashboard</Link>
          <h1 className="font-display mt-3 text-4xl text-plum">Orders</h1>
        </div>
        <Link className="rounded-control border border-border bg-white px-4 py-2.5 text-sm font-semibold text-plum" href="/admin/messages">
          Contact messages
        </Link>
      </header>
      <form className="mt-6 grid gap-3 rounded-card border border-border bg-white p-4 shadow-card sm:grid-cols-[1fr_190px_190px_auto]" method="get">
        <label className="sr-only" htmlFor="order-search">Search orders</label>
        <input className="h-11 rounded-control border border-border px-3 text-sm" defaultValue={"q" in query ? query.q : ""} id="order-search" maxLength={100} name="q" placeholder="Order number, customer, email" />
        <label className="sr-only" htmlFor="order-status">Filter by status</label>
        <select className="h-11 rounded-control border border-border bg-white px-3 text-sm" defaultValue={"status" in query ? query.status ?? "" : ""} id="order-status" name="status">
          <option value="">All statuses</option>
          {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <label className="sr-only" htmlFor="shipment-status">Filter by shipment status</label>
        <select className="h-11 rounded-control border border-border bg-white px-3 text-sm" defaultValue={"shipmentStatus" in query ? query.shipmentStatus ?? "" : ""} id="shipment-status" name="shipmentStatus">
          <option value="">All shipments</option>
          {["PENDING", "PACKING", "READY_TO_SHIP", "SHIPPED", "IN_TRANSIT", "DELIVERED", "EXCEPTION", "RETURNED", "CANCELLED"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
        </select>
        <button className="min-h-11 rounded-control bg-plum px-5 text-sm font-semibold text-white" type="submit">Filter</button>
      </form>
      <div className="mt-5 overflow-x-auto rounded-card border border-border bg-white shadow-card">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-ivory text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Method / payment</th><th className="px-4 py-3">Order status</th><th className="px-4 py-3">Shipment</th><th className="px-4 py-3">Date</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr className="border-t border-border/70" key={order.id}>
                <td className="px-4 py-3"><Link className="font-semibold text-plum underline" href={`/admin/orders/${encodeURIComponent(order.id)}`}>{order.orderNumber}</Link></td>
                <td className="px-4 py-3"><span className="block font-medium text-plum">{order.customerName}</span><span className="text-xs text-muted">{order.customerEmail}</span></td>
                <td className="px-4 py-3">{order._count.items}</td>
                <td className="px-4 py-3">₹{order.total.toFixed(2)}</td>
                <td className="px-4 py-3">{order.paymentMethod} · {order.paymentStatus}</td>
                <td className="px-4 py-3">{order.status}</td>
                <td className="px-4 py-3">{order.shipmentStatus.replaceAll("_", " ")}</td>
                <td className="px-4 py-3">{order.createdAt.toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className="px-4 py-10 text-center text-muted" colSpan={8}>No orders match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <nav aria-label="Order pages" className="mt-5 flex items-center justify-between gap-4 text-sm">
        <span className="text-muted">{total} orders · page {query.page} of {Math.max(1, totalPages)}</span>
        <div className="flex gap-2">
          {query.page > 1 && <Link className="rounded-control border border-border bg-white px-4 py-2 text-plum" href={pageHref(query.page - 1)}>Previous</Link>}
          {query.page < totalPages && <Link className="rounded-control border border-border bg-white px-4 py-2 text-plum" href={pageHref(query.page + 1)}>Next</Link>}
        </div>
      </nav>
      {!parsed.success && <p className="mt-4 text-sm text-error" role="alert">Invalid filters were ignored.</p>}
    </main>
  );
}
