import {
  catalogDiscoveryQuerySchema,
  collectionListQuerySchema,
  createCategorySchema,
  createCollectionSchema,
  createProductSchema,
  productListQuerySchema,
  slugParamSchema,
  type CreateCategoryInput,
  type CreateCollectionInput,
  type CreateProductInput,
} from "@/lib/catalog-schemas";
import {
  createCategoryRecord,
  createCollectionRecord,
  createProductRecord,
  findCategoryRecordBySlug,
  findCollectionRecordBySlug,
  findProductRecordBySlug,
  getCategoryRecord,
  listCategoryRecords,
  listCollectionRecords,
  listProductsFromFirestore,
} from "@/lib/repositories/product.repository";
import type {
  CategoryRecord,
  ProductRecord,
  ProductVariantRecord,
} from "@/lib/firestore/types";
import type { ProductAuditActor } from "@/lib/repositories/product.repository";

export const CATALOG_DISCOVERY_PAGE_SIZE = 12;
const KNOWN_OCCASIONS = ["Bridal", "Festive", "Daily Wear", "Office Wear"] as const;

export type CatalogDiscoveryResult = {
  products: Awaited<ReturnType<typeof listProducts>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CatalogFacets = {
  categories: Array<{ id: string; name: string; slug: string; parentId: string | null }>;
  occasions: string[];
  materials: string[];
  finishes: string[];
  stoneTypes: string[];
  colors: string[];
};

function compareText(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

function compareNewest(left: { createdAt: Date; id: string }, right: { createdAt: Date; id: string }) {
  return right.createdAt.getTime() - left.createdAt.getTime() || left.id.localeCompare(right.id);
}

function sortVariants(variants: ProductVariantRecord[]) {
  return [...variants].sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
}

function categoryLookup(categories: CategoryRecord[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

export async function getCatalogFacets(): Promise<CatalogFacets> {
  const [products, categories] = await Promise.all([
    listProductsFromFirestore(),
    listCategoryRecords(),
  ]);
  const activeCategoryIds = new Set(categories.map((category) => category.id));
  const activeProducts = products.filter((product) => activeCategoryIds.has(product.categoryId));
  const materials = new Set<string>();
  const finishes = new Set<string>();
  const stoneTypes = new Set<string>();
  const colors = new Set<string>();

  for (const product of activeProducts) {
    materials.add(product.material);
    if (product.stoneType) stoneTypes.add(product.stoneType);
    for (const variant of product.variants.filter((item) => item.active)) {
      finishes.add(variant.name);
      if (variant.color) colors.add(variant.color);
    }
  }

  return {
    categories: categories.map(({ id, name, slug, parentId }) => ({
      id,
      name,
      slug,
      parentId,
    })),
    occasions: [...KNOWN_OCCASIONS],
    materials: [...materials].sort(compareText),
    finishes: [...finishes].sort(compareText),
    stoneTypes: [...stoneTypes].sort(compareText),
    colors: [...colors].sort(compareText),
  };
}

function textMatches(value: string | null | undefined, query: string) {
  return value?.toLocaleLowerCase().includes(query) ?? false;
}

export async function discoverCatalogProducts(
  input: unknown,
  collectionSlug?: string,
  maximumPrice?: number,
): Promise<CatalogDiscoveryResult> {
  const query = catalogDiscoveryQuerySchema.parse(input);
  const validatedCollectionSlug = collectionSlug
    ? slugParamSchema.parse(collectionSlug)
    : undefined;
  const [allProducts, categories, collections] = await Promise.all([
    listProductsFromFirestore(),
    listCategoryRecords(),
    listCollectionRecords(),
  ]);
  const categoriesById = categoryLookup(categories);
  const normalizedQuery = query.q?.toLocaleLowerCase();
  const collectionId = validatedCollectionSlug
    ? collections.find((collection) => collection.slug === validatedCollectionSlug)?.id
    : undefined;
  if (validatedCollectionSlug && !collectionId) {
    return {
      products: [],
      total: 0,
      page: 1,
      pageSize: CATALOG_DISCOVERY_PAGE_SIZE,
      totalPages: 0,
    };
  }
  const parentCategoryId = query.parentCategory
    ? categories.find((category) => category.slug === query.parentCategory)?.id
    : undefined;

  const matches = allProducts.flatMap((product) => {
    const category = categoriesById.get(product.categoryId);
    if (!category?.active) return [];
    if (query.category && category.slug !== query.category) return [];
    if (
      parentCategoryId &&
      category.id !== parentCategoryId &&
      category.parentId !== parentCategoryId
    ) return [];
    if (collectionId && !product.collectionIds.includes(collectionId)) return [];
    if (query.occasion && !product.occasions.includes(query.occasion)) return [];
    if (query.material && product.material.toLocaleLowerCase() !== query.material.toLocaleLowerCase()) return [];
    if (query.stoneType && (product.stoneType ?? "").toLocaleLowerCase() !== query.stoneType.toLocaleLowerCase()) return [];

    const variants = product.variants.filter((variant) => {
      if (!variant.active) return false;
      if (query.minPrice !== undefined && variant.price < query.minPrice) return false;
      if (query.maxPrice !== undefined && variant.price > query.maxPrice) return false;
      if (maximumPrice !== undefined && variant.price > maximumPrice) return false;
      if (query.finish && variant.name.toLocaleLowerCase() !== query.finish.toLocaleLowerCase()) return false;
      if (query.color && (variant.color ?? "").toLocaleLowerCase() !== query.color.toLocaleLowerCase()) return false;
      if (query.inStock !== undefined && (variant.inventoryQuantity > 0) !== query.inStock) return false;
      return true;
    });
    const hasVariantFilters =
      query.minPrice !== undefined ||
      query.maxPrice !== undefined ||
      maximumPrice !== undefined ||
      query.finish !== undefined ||
      query.color !== undefined ||
      query.inStock !== undefined;
    if (hasVariantFilters && variants.length === 0) return [];

    if (
      normalizedQuery &&
      ![
        product.name,
        product.description,
        category.name,
        product.material,
        product.plating,
        product.stoneType,
        ...product.variants.filter((variant) => variant.active).map((variant) => variant.sku),
      ].some((value) => textMatches(value, normalizedQuery))
    ) {
      return [];
    }

    return [{ product, category, variants }];
  });

  const queryRank = (product: ProductRecord, category: CategoryRecord) => {
    if (!normalizedQuery) return 0;
    const name = product.name.toLocaleLowerCase();
    const categoryName = category.name.toLocaleLowerCase();
    if (name === normalizedQuery) return 0;
    if (name.startsWith(normalizedQuery)) return 1;
    if (categoryName.startsWith(normalizedQuery)) return 2;
    if (product.variants.some((variant) => variant.active && variant.sku.toLocaleLowerCase().startsWith(normalizedQuery))) return 3;
    return 4;
  };

  matches.sort((a, b) => {
    if (query.sort === "newest") return compareNewest(a.product, b.product);
    if (query.sort === "price-asc" || query.sort === "price-desc") {
      const direction = query.sort === "price-asc" ? 1 : -1;
      const aPrice = Math.min(...a.variants.map((variant) => variant.price));
      const bPrice = Math.min(...b.variants.map((variant) => variant.price));
      return (aPrice - bPrice) * direction || a.product.id.localeCompare(b.product.id);
    }
    return queryRank(a.product, a.category) - queryRank(b.product, b.category) ||
      compareNewest(a.product, b.product);
  });

  const total = matches.length;
  const totalPages = Math.ceil(total / CATALOG_DISCOVERY_PAGE_SIZE);
  const page = Math.min(query.page, Math.max(1, totalPages));
  const products = matches
    .slice((page - 1) * CATALOG_DISCOVERY_PAGE_SIZE, page * CATALOG_DISCOVERY_PAGE_SIZE)
    .map(({ product, category, variants }) => ({
      ...product,
      category: { name: category.name, slug: category.slug },
      variants: sortVariants(variants),
    }));

  return {
    products,
    total,
    page,
    pageSize: CATALOG_DISCOVERY_PAGE_SIZE,
    totalPages,
  };
}

export async function listProducts(input: unknown = {}) {
  const query = productListQuerySchema.parse(input);
  const [allProducts, categories, collections] = await Promise.all([
    listProductsFromFirestore(),
    listCategoryRecords(),
    listCollectionRecords(),
  ]);
  const categoriesById = categoryLookup(categories);
  const collectionId = query.collection
    ? collections.find((collection) => collection.slug === query.collection)?.id
    : undefined;
  if (query.collection && !collectionId) return [];

  return allProducts
    .flatMap((product) => {
      const category = categoriesById.get(product.categoryId);
      if (!category?.active) return [];
      if (query.category && category.slug !== query.category) return [];
      if (query.occasion && !product.occasions.includes(query.occasion)) return [];
      if (collectionId && !product.collectionIds.includes(collectionId)) return [];
      const variants = sortVariants(product.variants.filter((variant) =>
        variant.active &&
        (query.minPrice === undefined || variant.price >= query.minPrice) &&
        (query.maxPrice === undefined || variant.price <= query.maxPrice),
      ));
      if ((query.minPrice !== undefined || query.maxPrice !== undefined) && variants.length === 0) return [];
      return [{
        ...product,
        category: { name: category.name, slug: category.slug },
        variants,
      }];
    })
    .sort((a, b) =>
      query.sort === "newest"
        ? compareNewest(a, b)
        : Number(b.featured) - Number(a.featured) || compareNewest(a, b),
    )
    .slice(0, query.limit);
}

export async function getProductBySlug(input: unknown) {
  const slug = slugParamSchema.parse(input);
  const product = await findProductRecordBySlug(slug);
  if (!product?.active) return null;
  const [category, collections] = await Promise.all([
    getCategoryRecord(product.categoryId),
    listCollectionRecords(),
  ]);
  if (!category?.active) return null;
  return {
    ...product,
    category: { name: category.name, slug: category.slug },
    variants: sortVariants(product.variants.filter((variant) => variant.active)),
    collections: product.collectionIds.flatMap((collectionId) =>
      collections.some((collection) => collection.id === collectionId && collection.active)
        ? [{ collectionId }]
        : [],
    ),
  };
}

export async function getRelatedProducts(input: {
  productId: string;
  categoryId: string;
  collectionIds: string[];
  limit?: number;
}) {
  const query = productListQuerySchema.shape.limit.parse(input.limit ?? 4);
  const [allProducts, categories] = await Promise.all([
    listProductsFromFirestore(),
    listCategoryRecords(),
  ]);
  const categoriesById = categoryLookup(categories);
  return allProducts
    .filter((product) =>
      product.active &&
      product.id !== input.productId &&
      (product.categoryId === input.categoryId ||
        product.collectionIds.some((id) => input.collectionIds.includes(id))) &&
      categoriesById.get(product.categoryId)?.active,
    )
    .sort((a, b) => Number(b.featured) - Number(a.featured) || compareNewest(a, b))
    .slice(0, query)
    .map((product) => {
      const category = categoriesById.get(product.categoryId)!;
      return {
        ...product,
        category: { name: category.name, slug: category.slug },
        variants: sortVariants(product.variants.filter((variant) => variant.active)),
      };
    });
}

export async function listCategories() {
  return (await listCategoryRecords()).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    parentId: category.parentId,
  }));
}

export async function getCategoryBySlug(input: unknown) {
  const slug = slugParamSchema.parse(input);
  const category = await findCategoryRecordBySlug(slug);
  if (!category?.active) return null;
  const children = (await listCategoryRecords()).filter((item) =>
    item.active && item.parentId === category.id,
  );
  return { ...category, children };
}

export async function listCollections(input: unknown = {}) {
  const query = collectionListQuerySchema.parse(input);
  const [allCollections, allProducts] = await Promise.all([
    listCollectionRecords(),
    listProductsFromFirestore(),
  ]);
  const productsById = new Map(allProducts.map((product) => [product.id, product]));
  return allCollections.slice(0, query.limit).map((collection) => ({
    ...collection,
    products: collection.productIds
      .slice(0, 12)
      .flatMap((productId, sortOrder) => {
        const product = productsById.get(productId);
        return product?.active
          ? [{ collectionId: collection.id, productId, sortOrder, product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              imageUrls: product.imageUrls,
            } }]
          : [];
      }),
  }));
}

export async function getCollectionBySlug(input: unknown) {
  const slug = slugParamSchema.parse(input);
  const collection = await findCollectionRecordBySlug(slug);
  return collection?.active ? collection : null;
}

export async function createCategory(input: unknown, actorId: ProductAuditActor = "system") {
  const data: CreateCategoryInput = createCategorySchema.parse(input);
  return createCategoryRecord(data, actorId);
}

export async function createCollection(input: unknown, actorId: ProductAuditActor = "system") {
  const data: CreateCollectionInput = createCollectionSchema.parse(input);
  return createCollectionRecord(data, actorId);
}

export async function createProduct(input: unknown, actorId: ProductAuditActor = "system") {
  const data: CreateProductInput = createProductSchema.parse(input);
  return createProductRecord(data, actorId);
}

export function getCatalogPrice(variant: ProductVariantRecord) {
  return Number(variant.price);
}
