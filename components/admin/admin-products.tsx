"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseProductImageUrls } from "@/lib/product-image-urls";
import { ProductImageInput } from "@/components/admin/product-image-input";

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sortOrder: number;
};
type AdminVariant = {
  id: string;
  sku: string;
  name: string;
  price: string;
  inventoryQuantity: number;
  active: boolean;
};
type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  categoryId: string;
  category: { name: string };
  imageUrls: string[];
  material: string;
  plating: string;
  description: string;
  variants: AdminVariant[];
};

async function readError(response: Response) {
  const body: unknown = await response.json().catch(() => ({}));
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return "The change could not be saved.";
}

export function AdminProducts({
  initialProducts,
  categories: initialCategories,
  page,
  query,
  totalPages,
}: {
  initialProducts: AdminProduct[];
  categories: AdminCategory[];
  page: number;
  query: string;
  totalPages: number;
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refresh server-provided catalog state after Next.js router.refresh().
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setProducts(initialProducts), [initialProducts]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setCategories(initialCategories), [initialCategories]);

  async function mutate(url: string, method: string, payload?: unknown) {
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(url, {
        method,
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      if (!response.ok) {
        setError(await readError(response));
        return false;
      }
      setNotice("Saved successfully.");
      router.refresh();
      return true;
    } catch {
      setError("Could not connect to the admin service. Please try again.");
      return false;
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const saved = await mutate("/api/admin/categories", "POST", {
      name: form.get("name"),
      slug: form.get("slug"),
      active: true,
      sortOrder: Number(form.get("sortOrder") || 0),
    });
    if (saved) formElement.reset();
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const saved = await mutate("/api/admin/products", "POST", {
      name: form.get("name"),
      slug: form.get("slug"),
      description: form.get("description"),
      categoryId: form.get("categoryId"),
      material: form.get("material"),
      plating: form.get("plating"),
      imageUrls: parseProductImageUrls(String(form.get("imageUrls") ?? "")),
      active: true,
      featured: false,
      occasions: [],
      variants: [{
        sku: form.get("sku"),
        name: form.get("variantName"),
        price: Number(form.get("price")),
        inventoryQuantity: Number(form.get("stock")),
        active: true,
      }],
      collectionIds: [],
    });
    if (saved) formElement.reset();
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>, product: AdminProduct) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutate(`/api/admin/products/${encodeURIComponent(product.id)}`, "PATCH", {
      name: form.get("name"),
      slug: form.get("slug"),
      description: form.get("description"),
      categoryId: form.get("categoryId"),
      material: form.get("material"),
      plating: form.get("plating"),
      imageUrls: parseProductImageUrls(String(form.get("imageUrls") ?? "")),
      active: form.get("active") === "on",
    });
  }

  async function updateVariantStock(product: AdminProduct, variant: AdminVariant, stock: number) {
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}/variants/${encodeURIComponent(variant.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inventoryQuantity: stock }),
        },
      );
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
    } catch {
      setError("Could not connect to the admin service. Please try again.");
      return;
    }
    setProducts((items) => items.map((item) =>
      item.id !== product.id
        ? item
        : {
            ...item,
            variants: item.variants.map((current) =>
              current.id === variant.id
                ? { ...current, inventoryQuantity: stock }
                : current,
            ),
          },
    ));
    setNotice(`Stock updated for ${variant.sku}.`);
  }

  async function archiveProduct(product: AdminProduct) {
    if (!window.confirm(`Archive ${product.name}? It will no longer appear in the storefront.`)) return;
    if (await mutate(`/api/admin/products/${encodeURIComponent(product.id)}`, "DELETE")) {
      setProducts((items) => items.map((item) =>
        item.id === product.id ? { ...item, active: false } : item,
      ));
    }
  }

  async function saveCategory(category: AdminCategory, active: boolean) {
    const saved = await mutate(`/api/admin/categories/${encodeURIComponent(category.id)}`, "PATCH", { active });
    if (saved) {
      setCategories((items) => items.map((item) =>
        item.id === category.id ? { ...item, active } : item,
      ));
    }
  }

  async function saveCategoryDetails(
    event: FormEvent<HTMLFormElement>,
    category: AdminCategory,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextCategory = {
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? ""),
      sortOrder: Number(form.get("sortOrder") ?? 0),
      active: form.get("active") === "on",
    };
    const saved = await mutate(
      `/api/admin/categories/${encodeURIComponent(category.id)}`,
      "PATCH",
      nextCategory,
    );
    if (saved) {
      setCategories((items) =>
        items.map((item) =>
          item.id === category.id ? { ...item, ...nextCategory } : item,
        ),
      );
    }
  }

  async function archiveCategory(category: AdminCategory) {
    if (!window.confirm(`Archive category ${category.name}?`)) return;
    if (await mutate(`/api/admin/categories/${encodeURIComponent(category.id)}`, "DELETE")) {
      setCategories((items) => items.map((item) =>
        item.id === category.id ? { ...item, active: false } : item,
      ));
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {error && <p className="rounded-control bg-error/10 px-4 py-3 text-sm text-error" role="alert">{error}</p>}
      {notice && <p className="rounded-control bg-success/10 px-4 py-3 text-sm text-success" role="status">{notice}</p>}

      <section className="grid gap-6 lg:grid-cols-2">
        <details className="rounded-card border border-border bg-white p-5 shadow-card">
          <summary className="cursor-pointer font-semibold text-plum">Add product and first variant</summary>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={createProduct}>
            <label className="space-y-1 text-sm text-plum">Product name<Input name="name" required /></label>
            <label className="space-y-1 text-sm text-plum">Slug<Input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label>
            <label className="space-y-1 text-sm text-plum">Category<select className="h-11 w-full rounded-control border border-border bg-white px-3 text-sm" name="categoryId" required>{categories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="space-y-1 text-sm text-plum">Material<Input name="material" required /></label>
            <label className="space-y-1 text-sm text-plum">Plating / finish<Input name="plating" required /></label>
            <ProductImageInput required />
            <label className="space-y-1 text-sm text-plum sm:col-span-2">Description<textarea className="min-h-24 w-full rounded-control border border-border p-3 text-sm" maxLength={10000} minLength={10} name="description" required /></label>
            <label className="space-y-1 text-sm text-plum">Variant name<Input name="variantName" required /></label>
            <label className="space-y-1 text-sm text-plum">SKU<Input name="sku" required /></label>
            <label className="space-y-1 text-sm text-plum">Price (₹)<Input min="0.01" name="price" required step="0.01" type="number" /></label>
            <label className="space-y-1 text-sm text-plum">Initial stock<Input min="0" name="stock" required type="number" /></label>
            <div className="sm:col-span-2"><Button type="submit">Create product</Button></div>
          </form>
        </details>

        <details className="rounded-card border border-border bg-white p-5 shadow-card">
          <summary className="cursor-pointer font-semibold text-plum">Add category</summary>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={createCategory}>
            <label className="space-y-1 text-sm text-plum">Category name<Input name="name" required /></label>
            <label className="space-y-1 text-sm text-plum">Slug<Input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label>
            <label className="space-y-1 text-sm text-plum">Sort order<Input defaultValue="0" min="0" name="sortOrder" type="number" /></label>
            <div className="flex items-end"><Button type="submit">Create category</Button></div>
          </form>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead><tr className="border-b border-border text-muted"><th className="py-2">Category</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{categories.map((category) => (
                <tr className="border-b border-border/70" key={category.id}>
                  <td className="py-3 font-medium text-plum">{category.name}</td>
                  <td className="text-muted">{category.slug}</td>
                  <td>{category.active ? "Active" : "Archived"}</td>
                  <td>
                    <div className="flex gap-2">
                      <details>
                        <summary className="cursor-pointer text-plum underline">Edit</summary>
                        <form className="mt-2 grid min-w-64 gap-2 rounded-control border border-border bg-white p-3" onSubmit={(event) => void saveCategoryDetails(event, category)}>
                          <label className="text-xs text-muted">Name<Input defaultValue={category.name} name="name" required /></label>
                          <label className="text-xs text-muted">Slug<Input defaultValue={category.slug} name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label>
                          <label className="text-xs text-muted">Sort order<Input defaultValue={category.sortOrder} min="0" name="sortOrder" type="number" /></label>
                          <label className="flex items-center gap-2 text-xs text-plum"><input defaultChecked={category.active} name="active" type="checkbox" />Active</label>
                          <Button size="sm" type="submit">Save category</Button>
                        </form>
                      </details>
                      <button className="text-plum underline" onClick={() => void saveCategory(category, !category.active)} type="button">{category.active ? "Disable" : "Enable"}</button>
                      {category.active && <button className="text-error underline" onClick={() => void archiveCategory(category)} type="button">Archive</button>}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </details>
      </section>

      <section aria-labelledby="admin-products-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Catalogue management</p><h2 className="font-display mt-2 text-3xl text-plum" id="admin-products-heading">Products & inventory</h2></div>
          <p className="text-sm text-muted">Page {page} of {Math.max(1, totalPages)}</p>
        </div>
        <form action="/admin" className="mt-4 flex flex-wrap gap-2">
          <Input aria-label="Search products" defaultValue={query} maxLength={100} name="q" placeholder="Search product, slug or SKU" />
          <button className="min-h-11 rounded-control bg-plum px-5 text-sm font-semibold text-white" type="submit">Search</button>
        </form>
        <nav aria-label="Product pages" className="mt-3 flex justify-end gap-2">
          {page > 1 && <a className="rounded-control border border-border bg-white px-4 py-2 text-sm text-plum" href={`/admin?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>Previous</a>}
          {page < totalPages && <a className="rounded-control border border-border bg-white px-4 py-2 text-sm text-plum" href={`/admin?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>Next</a>}
        </nav>
        <div className="mt-4 space-y-4">
          {products.map((product) => (
            <article className="rounded-card border border-border bg-white p-4 shadow-card sm:p-5" key={product.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-semibold text-plum">{product.name}</h3><p className="mt-1 text-sm text-muted">{product.category.name} · /{product.slug} · {product.active ? "Active" : "Archived"}</p></div>
                <div className="flex gap-3"><button className="text-sm font-medium text-plum underline" onClick={async () => {
                  const active = !product.active;
                  if (await mutate(`/api/admin/products/${encodeURIComponent(product.id)}`, "PATCH", { active })) {
                    setProducts((items) => items.map((item) => item.id === product.id ? { ...item, active } : item));
                  }
                }} type="button">{product.active ? "Disable" : "Enable"}</button>{product.active && <button className="text-sm font-medium text-error underline" onClick={() => void archiveProduct(product)} type="button">Archive</button>}</div>
              </div>
              <details className="mt-4 rounded-control border border-border p-3">
                <summary className="cursor-pointer text-sm font-medium text-plum">Edit product details</summary>
                <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void saveProduct(event, product)}>
                  <label className="space-y-1 text-sm text-plum">Name<Input defaultValue={product.name} name="name" required /></label>
                  <label className="space-y-1 text-sm text-plum">Slug<Input defaultValue={product.slug} name="slug" required /></label>
                  <label className="space-y-1 text-sm text-plum">Category<select className="h-11 w-full rounded-control border border-border bg-white px-3 text-sm" defaultValue={product.categoryId} name="categoryId">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                  <label className="space-y-1 text-sm text-plum">Material<Input defaultValue={product.material} name="material" required /></label>
                  <label className="space-y-1 text-sm text-plum">Finish<Input defaultValue={product.plating} name="plating" required /></label>
                  <label className="flex min-h-11 items-center gap-2 text-sm text-plum"><input defaultChecked={product.active} name="active" type="checkbox" />Active on storefront</label>
                  <label className="space-y-1 text-sm text-plum sm:col-span-2">Description<textarea className="min-h-24 w-full rounded-control border border-border p-3 text-sm" defaultValue={product.description} minLength={10} name="description" required /></label>
                  <ProductImageInput
                    initialUrls={product.imageUrls}
                    key={`${product.id}:${product.imageUrls.join("\n")}`}
                    required
                  />
                  <div className="sm:col-span-2"><Button size="sm" type="submit">Save product</Button></div>
                </form>
              </details>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-sm">
                  <thead><tr className="border-b border-border text-muted"><th className="py-2">Variant / SKU</th><th>Price</th><th>Stock</th><th>Availability</th><th>Update</th></tr></thead>
                  <tbody>{product.variants.map((variant) => (
                    <VariantRow key={variant.id} onSave={(stock) => updateVariantStock(product, variant, stock)} variant={variant} />
                  ))}</tbody>
                </table>
              </div>
              <AddVariantForm onCreate={async (data) => {
                const saved = await mutate(`/api/admin/products/${encodeURIComponent(product.id)}/variants`, "POST", data);
                if (saved) {
                  const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`);
                  if (response.ok) {
                    const body = await response.json() as { product: AdminProduct };
                    setProducts((items) => items.map((item) => item.id === product.id ? body.product : item));
                  }
                }
              }} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function VariantRow({
  variant,
  onSave,
}: {
  variant: AdminVariant;
  onSave: (quantity: number) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(variant.inventoryQuantity);
  return (
    <tr className="border-b border-border/70">
      <td className="py-3"><span className="block font-medium text-plum">{variant.name}</span><span className="text-xs text-muted">{variant.sku}</span></td>
      <td>₹{Number(variant.price).toLocaleString("en-IN")}</td>
      <td><Input aria-label={`Stock for ${variant.sku}`} className="h-10 w-24" min="0" onChange={(event) => setQuantity(Number(event.target.value))} type="number" value={quantity} /></td>
      <td>{variant.active ? "Active" : "Archived"}</td>
      <td><button className="text-sm font-medium text-plum underline" onClick={() => void onSave(quantity)} type="button">Save stock</button></td>
    </tr>
  );
}

function AddVariantForm({ onCreate }: { onCreate: (data: unknown) => Promise<void> }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await onCreate({
      sku: form.get("sku"),
      name: form.get("name"),
      price: Number(form.get("price")),
      inventoryQuantity: Number(form.get("stock")),
      active: true,
    });
    formElement.reset();
  }
  return (
    <details className="mt-4 rounded-control border border-border p-3">
      <summary className="cursor-pointer text-sm font-medium text-plum">Add variant</summary>
      <form className="mt-3 grid gap-3 sm:grid-cols-4" onSubmit={submit}>
        <Input aria-label="Variant name" name="name" placeholder="Finish / size" required />
        <Input aria-label="Variant SKU" name="sku" placeholder="SKU" required />
        <Input aria-label="Variant price" min="0.01" name="price" placeholder="Price" required step="0.01" type="number" />
        <div className="flex gap-2"><Input aria-label="Variant stock" min="0" name="stock" placeholder="Stock" required type="number" /><Button size="sm" type="submit">Add</Button></div>
      </form>
    </details>
  );
}
