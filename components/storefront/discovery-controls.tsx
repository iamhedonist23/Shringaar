"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ProductGrid } from "@/components/storefront/product-grid";
import type { StoreProduct } from "@/components/storefront/product-tile";
import type { CatalogDiscoveryQuery } from "@/lib/catalog-schemas";
import type { CatalogDiscoveryResult, CatalogFacets } from "@/lib/catalog";

export function DiscoveryFilters({
  action,
  query,
  facets,
  showKeyword = false,
}: {
  action: string;
  query: CatalogDiscoveryQuery;
  facets: CatalogFacets;
  showKeyword?: boolean;
}) {
  const selectClass =
    "mt-3 h-11 w-full rounded-control border border-border bg-white px-3 text-sm text-plum focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";
  const fieldClass = "mt-3 block text-xs font-medium text-muted";
  function options(values: string[], current?: string) {
    return [...new Set([...values, ...(current ? [current] : [])])].sort((a, b) =>
      a.localeCompare(b),
    );
  }
  const topCategories = facets.categories.filter((category) => !category.parentId);
  const productTypes = topCategories.length ? topCategories : facets.categories;
  const categoryParent = (categoryId: string | null, slug: string) =>
    categoryId
      ? facets.categories.find((category) => category.id === categoryId)?.slug ?? ""
      : slug;

  return (
    <form
      action={action}
      className="h-fit rounded-card border border-border bg-white px-4 shadow-card sm:px-5"
      method="get"
    >
      {query.q && !showKeyword && <input name="q" type="hidden" value={query.q} />}
      <div className="flex items-center justify-between gap-2 py-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-plum">Filters</h2>
        <Link
          className="text-sm font-semibold text-muted underline-offset-4 hover:text-plum hover:underline"
          href={query.q ? `${action}?q=${encodeURIComponent(query.q)}` : action}
        >
          Clear all
        </Link>
      </div>

      <FilterSection title="Product Type">
        <label className={fieldClass}>
          Product type
          <select
            className={selectClass}
            defaultValue={query.parentCategory ?? ""}
            name="parentCategory"
            onChange={(event) => {
              const subcategory = event.currentTarget.form?.querySelector<HTMLSelectElement>(
                'select[name="category"]',
              );
              const selectedCategory = subcategory?.selectedOptions[0];
              if (
                subcategory?.value &&
                subcategory.value !== event.currentTarget.value &&
                selectedCategory?.dataset.parentCategory !== event.currentTarget.value
              ) {
                subcategory.value = "";
              }
            }}
          >
            <option value="">All product types</option>
            {productTypes.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </FilterSection>

      <FilterSection title="Price">
        <div className="grid grid-cols-2 gap-2">
          <label className={fieldClass}>
            From (₹)
            <input className={selectClass} defaultValue={query.minPrice} min="0" max="10000000" name="minPrice" placeholder="Min" type="number" />
          </label>
          <label className={fieldClass}>
            To (₹)
            <input className={selectClass} defaultValue={query.maxPrice} min="0" max="10000000" name="maxPrice" placeholder="Max" type="number" />
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Color">
        <label className={fieldClass}>
          Colour
          <select className={selectClass} defaultValue={query.color ?? ""} name="color">
            <option value="">All colours</option>
            {options(facets.colors, query.color).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </FilterSection>

      <FilterSection title="Metal">
        <label className={fieldClass}>
          Material
          <select className={selectClass} defaultValue={query.material ?? ""} name="material">
            <option value="">All materials</option>
            {options(facets.materials, query.material).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </FilterSection>

      <FilterSection title="Style">
        <label className={fieldClass}>
          Finish
          <select className={selectClass} defaultValue={query.finish ?? ""} name="finish">
            <option value="">All finishes</option>
            {options(facets.finishes, query.finish).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className={fieldClass}>
          Stone / detail
          <select className={selectClass} defaultValue={query.stoneType ?? ""} name="stoneType">
            <option value="">All details</option>
            {options(facets.stoneTypes, query.stoneType).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </FilterSection>

      <FilterSection title="Sub Category">
        <label className={fieldClass}>
          Category
          <select
            className={selectClass}
            defaultValue={query.category ?? ""}
            name="category"
            onChange={(event) => {
              const parent = event.currentTarget.form?.querySelector<HTMLSelectElement>(
                'select[name="parentCategory"]',
              );
              if (parent) {
                parent.value = categoryParent(
                  facets.categories.find((category) => category.slug === event.currentTarget.value)?.parentId ?? null,
                  event.currentTarget.value,
                );
              }
            }}
          >
            <option value="">All categories</option>
            {facets.categories.map((category) => (
              <option
                data-parent-category={categoryParent(category.parentId, category.slug)}
                key={category.slug}
                value={category.slug}
              >
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </FilterSection>

      <FilterSection title="Shop For">
        <label className={fieldClass}>
          Occasion
          <select className={selectClass} defaultValue={query.occasion ?? ""} name="occasion">
            <option value="">Any occasion</option>
            {facets.occasions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className={`${fieldClass} pb-1`}>
          Availability
          <select className={selectClass} defaultValue={query.inStock === undefined ? "" : String(query.inStock)} name="inStock">
            <option value="">All items</option>
            <option value="true">In stock</option>
            <option value="false">Out of stock</option>
          </select>
        </label>
      </FilterSection>

      {showKeyword && (
        <label className={`${fieldClass} pb-4`}>
          Search this collection
          <input
            className={selectClass}
            defaultValue={query.q}
            maxLength={100}
            minLength={2}
            name="q"
            placeholder="Product, material, stone…"
            type="search"
          />
        </label>
      )}

      <div className="py-4">
        <button
          className="inline-flex min-h-11 w-full items-center justify-center rounded-control bg-plum px-5 text-sm font-semibold text-white transition hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          type="submit"
        >
          Show results
        </button>
      </div>
    </form>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-t border-border/80">
      <summary className="flex min-h-[3.55rem] cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

function hiddenFilterFields(query: CatalogDiscoveryQuery) {
  return (
    <>
      {query.q && <input name="q" type="hidden" value={query.q} />}
      {query.category && <input name="category" type="hidden" value={query.category} />}
      {query.parentCategory && <input name="parentCategory" type="hidden" value={query.parentCategory} />}
      {query.minPrice !== undefined && <input name="minPrice" type="hidden" value={query.minPrice} />}
      {query.maxPrice !== undefined && <input name="maxPrice" type="hidden" value={query.maxPrice} />}
      {query.occasion && <input name="occasion" type="hidden" value={query.occasion} />}
      {query.material && <input name="material" type="hidden" value={query.material} />}
      {query.finish && <input name="finish" type="hidden" value={query.finish} />}
      {query.stoneType && <input name="stoneType" type="hidden" value={query.stoneType} />}
      {query.color && <input name="color" type="hidden" value={query.color} />}
      {query.inStock !== undefined && <input name="inStock" type="hidden" value={String(query.inStock)} />}
    </>
  );
}

export function DiscoveryListing({
  action,
  query,
  facets,
  products,
  result,
  showKeyword = false,
  unavailable = false,
  emptyTitle = "No matching pieces",
  emptyDescription = "No products match these filters. Try removing a filter or changing your search.",
}: {
  action: string;
  query: CatalogDiscoveryQuery;
  facets: CatalogFacets;
  products: StoreProduct[];
  result: CatalogDiscoveryResult | null;
  showKeyword?: boolean;
  unavailable?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const total = result?.total ?? products.length;

  return (
    <div className="mt-7 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-8">
      <DiscoveryFilters action={action} facets={facets} query={query} showKeyword={showKeyword} />
      <section aria-label="Product results" className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-muted">
            {total === 1 ? "1 piece" : `${total} pieces`}
          </p>
          <form action={action} className="flex items-center gap-2" method="get">
            {hiddenFilterFields(query)}
            <label className="whitespace-nowrap text-sm text-muted" htmlFor="catalog-sort">
              Sort by:
            </label>
            <select
              className="h-10 max-w-48 rounded-control border border-transparent bg-transparent px-1 text-sm font-semibold text-plum focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              defaultValue={query.sort}
              id="catalog-sort"
              name="sort"
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="relevance">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </form>
        </div>
        <ProductGrid
          columns={3}
          emptyDescription={unavailable ? "The catalogue could not be reached." : emptyDescription}
          emptyTitle={unavailable ? "Products unavailable" : emptyTitle}
          products={products}
        />
        {result && (
          <DiscoveryPagination
            page={result.page}
            pageSize={result.pageSize}
            path={action}
            query={query}
            total={result.total}
            totalPages={result.totalPages}
          />
        )}
      </section>
    </div>
  );
}

function pageHref(
  path: string,
  query: CatalogDiscoveryQuery,
  page: number,
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.parentCategory) params.set("parentCategory", query.parentCategory);
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.occasion) params.set("occasion", query.occasion);
  if (query.material) params.set("material", query.material);
  if (query.finish) params.set("finish", query.finish);
  if (query.stoneType) params.set("stoneType", query.stoneType);
  if (query.color) params.set("color", query.color);
  if (query.inStock !== undefined) params.set("inStock", String(query.inStock));
  if (query.sort !== "relevance") params.set("sort", query.sort);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export function DiscoveryPagination({
  path,
  query,
  total,
  page,
  pageSize,
  totalPages,
}: {
  path: string;
  query: CatalogDiscoveryQuery;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Product result pages"
      className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"
    >
      <p aria-live="polite" className="text-sm text-muted">
        {total === 0 ? "No matching pieces" : `Showing ${first}–${last} of ${total} pieces`}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              className="inline-flex min-h-10 items-center rounded-control border border-border px-4 text-sm font-medium text-plum hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              href={pageHref(path, query, page - 1)}
              rel="prev"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-control border border-border/60 px-4 text-sm text-gold-contrast">
              Previous
            </span>
          )}
          <span className="px-2 text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              className="inline-flex min-h-10 items-center rounded-control border border-border px-4 text-sm font-medium text-plum hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              href={pageHref(path, query, page + 1)}
              rel="next"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-control border border-border/60 px-4 text-sm text-gold-contrast">
              Next
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
