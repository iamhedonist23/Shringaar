import type { Metadata } from "next";
import Link from "next/link";
import { AdminProducts } from "@/components/admin/admin-products";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { adminPageQuerySchema } from "@/lib/admin-schemas";
import {
  listAdminProducts,
  listCategoryRecords,
} from "@/lib/repositories/product.repository";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const raw = await searchParams;
  const parsedQuery = adminPageQuerySchema.pick({ page: true, q: true }).safeParse({
    page: typeof raw.page === "string" ? raw.page : undefined,
    q: typeof raw.q === "string" ? raw.q : undefined,
  });
  const page = parsedQuery.success ? parsedQuery.data.page : 1;
  const query = parsedQuery.success ? parsedQuery.data.q : undefined;
  const pageSize = 25;
  const [{ products, total: totalProducts }, categoryRecords] = await Promise.all([
    listAdminProducts({ page, pageSize, q: query }),
    listCategoryRecords(true),
  ]);
  const categories = categoryRecords.map(({ id, name, slug, active, sortOrder }) => ({
    id,
    name,
    slug,
    active,
    sortOrder,
  }));

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-contrast">Shringaar</p>
          <h1 className="font-display mt-2 text-4xl text-plum">Admin dashboard</h1>
        </div>
        <nav aria-label="Admin sections" className="flex flex-wrap gap-2">
          <Link className="rounded-control bg-plum px-4 py-2.5 text-sm font-semibold text-white" href="/admin">Catalogue</Link>
          <Link className="rounded-control border border-border bg-white px-4 py-2.5 text-sm font-semibold text-plum" href="/admin/orders">Orders</Link>
          <Link className="rounded-control border border-border bg-white px-4 py-2.5 text-sm font-semibold text-plum" href="/admin/messages">Messages</Link>
          <AdminSignOutButton />
        </nav>
      </header>
      <AdminProducts
        categories={categories}
        page={page}
        query={query ?? ""}
        totalPages={Math.ceil(totalProducts / pageSize)}
        initialProducts={products.map((product) => ({
          ...product,
          variants: product.variants.map((variant) => ({
            ...variant,
            price: variant.price.toFixed(2),
          })),
        }))}
      />
      {!parsedQuery.success && <p className="mt-4 text-sm text-error" role="alert">Invalid product filters were ignored.</p>}
    </main>
  );
}
