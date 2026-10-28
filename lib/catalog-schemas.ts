import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const productImageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => {
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Image URL must be a site-relative path or an HTTP(S) URL.");

const productListLimitSchema = z.coerce.number().int().min(1).max(100).default(24);

export const productListQuerySchema = z.object({
  category: slugSchema.optional(),
  collection: slugSchema.optional(),
  occasion: z.string().trim().min(2).max(60).optional(),
  minPrice: z.coerce.number().finite().min(0).max(10_000_000).optional(),
  maxPrice: z.coerce.number().finite().min(0).max(10_000_000).optional(),
  sort: z.enum(["featured", "newest"]).default("featured"),
  limit: productListLimitSchema,
}).refine(
  (query) =>
    query.minPrice === undefined ||
    query.maxPrice === undefined ||
    query.minPrice <= query.maxPrice,
  { message: "minPrice must be less than or equal to maxPrice.", path: ["minPrice"] },
);

export const collectionListQuerySchema = z.object({
  limit: productListLimitSchema,
});

export const slugParamSchema = slugSchema;
export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

export const variantAvailabilityRequestSchema = z.object({
  variantId: z.string().trim().min(1).max(128),
  quantity: z.number().int().min(1).max(100),
});

export const variantAvailabilityResponseSchema = z.object({
  variantId: z.string().min(1),
  sku: z.string().min(1),
  available: z.boolean(),
  inventoryQuantity: z.number().int().min(0),
  price: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
});

const optionalTextFilter = (maxLength: number) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().min(1).max(maxLength).optional(),
  );

const optionalPrice = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().finite().min(0).max(10_000_000).optional(),
);

export const catalogDiscoveryQuerySchema = z
  .object({
    q: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().min(2).max(100).optional(),
    ),
    category: z.preprocess(
      (value) => (value === "" ? undefined : value),
      slugSchema.optional(),
    ),
    parentCategory: z.preprocess(
      (value) => (value === "" ? undefined : value),
      slugSchema.optional(),
    ),
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
    occasion: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.enum(["Bridal", "Festive", "Daily Wear", "Office Wear"]).optional(),
    ),
    material: optionalTextFilter(80),
    finish: optionalTextFilter(120),
    stoneType: optionalTextFilter(80),
    color: optionalTextFilter(60),
    inStock: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    ),
    sort: z.enum(["relevance", "newest", "price-asc", "price-desc"]).default("relevance"),
    page: z.coerce.number().int().min(1).max(1000).default(1),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    { message: "Minimum price must not exceed maximum price.", path: ["minPrice"] },
  );

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  imageUrl: productImageUrlSchema.optional(),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  parentId: z.string().trim().min(1).optional(),
});

export const createCollectionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  imageUrl: productImageUrlSchema.optional(),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  productIds: z.array(z.string().trim().min(1)).max(500).default([]),
});

const productVariantSchema = z.object({
  sku: z.string().trim().min(2).max(80),
  name: z.string().trim().min(1).max(120),
  options: z.record(z.string(), z.string()).optional(),
  color: z.string().trim().min(1).max(60).optional(),
  price: z.number().finite().positive().max(10_000_000),
  compareAtPrice: z.number().finite().positive().max(10_000_000).optional(),
  inventoryQuantity: z.number().int().min(0).max(1_000_000).default(0),
  active: z.boolean().default(true),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: slugSchema,
  description: z.string().trim().min(10).max(10000),
  shortDescription: z.string().trim().max(500).optional(),
  categoryId: z.string().trim().min(1),
  material: z.string().trim().min(2).max(120),
  plating: z.string().trim().min(2).max(120),
  stoneType: z.string().trim().max(120).optional(),
  occasions: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  specifications: z.record(z.string(), z.string()).optional(),
  imageUrls: z.array(productImageUrlSchema).min(1).max(30),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  variants: z.array(productVariantSchema).min(1).max(100),
  collectionIds: z.array(z.string().trim().min(1)).max(100).default([]),
}).superRefine((product, context) => {
  for (const [index, variant] of product.variants.entries()) {
    if (
      variant.compareAtPrice !== undefined &&
      variant.compareAtPrice < variant.price
    ) {
      context.addIssue({
        code: "custom",
        path: ["variants", index, "compareAtPrice"],
        message: "compareAtPrice must be greater than or equal to price.",
      });
    }
  }
});

export const adminLoginSchema = z.object({
  email: z.email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CatalogDiscoveryQuery = z.infer<typeof catalogDiscoveryQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
