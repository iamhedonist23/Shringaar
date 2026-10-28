import assert from "node:assert/strict";
import test from "node:test";
import {
  adminLoginSchema,
  catalogDiscoveryQuerySchema,
  collectionListQuerySchema,
  createCategorySchema,
  createProductSchema,
  productListQuerySchema,
  variantAvailabilityRequestSchema,
  variantAvailabilityResponseSchema,
} from "../lib/catalog-schemas";
import {
  isSameOrigin,
  isSameOriginAdminRole,
  isSameOriginRequest,
  isTrustedAdminRequest,
} from "../lib/admin-auth";
import { updateAdminProductSchema } from "../lib/admin-schemas";
import { isAdminRole } from "../lib/auth";
import { getPostgresSchema, getQualifiedPostgresTable } from "../scripts/postgres-schema";
import { parseProductImageUrls } from "../lib/product-image-urls";
import { buildProductSpecificationRows } from "../lib/product-specifications";

const validProduct = {
  name: "Noor Kundan Dome Jhumkas",
  slug: "noor-kundan-dome-jhumkas",
  description: "Kundan-look dome jhumkas finished in 1g gold plating.",
  categoryId: "category-1",
  material: "Brass",
  plating: "1g gold plating",
  imageUrls: ["/images/festival-earrings.jpg"],
  variants: [
    {
      sku: "NOOR-JHUMKA-AG",
      name: "Antique Gold",
      price: 1490,
      compareAtPrice: 1990,
      inventoryQuantity: 12,
    },
  ],
};

test("product specification rows omit duplicate core fields and format custom labels", () => {
  assert.deepEqual(
    buildProductSpecificationRows({
      material: "Brass",
      finish: "1g gold plating",
      stoneType: "Kundan",
      specifications: {
        BaseMaterial: "Brass",
        Finish: "1g gold plating",
        "Stone / detail": "Kundan",
        Stone: "Kundan",
        Care: "Keep away from water.",
        occasionSuitable: "Festive wear",
      },
    }),
    {
      rows: [
        { label: "Material", value: "Brass" },
        { label: "Finish", value: "1g gold plating" },
        { label: "Stone / detail", value: "Kundan" },
        { label: "Occasion suitable", value: "Festive wear" },
      ],
      care: "Keep away from water.",
    },
  );
});

test("product specification aliases supply missing core details without duplicate labels", () => {
  assert.deepEqual(
    buildProductSpecificationRows({
      material: "",
      finish: "",
      stoneType: null,
      specifications: {
        BaseMaterial: "Brass",
        material: "Copper",
        plating: "Gold tone",
        stoneType: "Kundan",
      },
    }).rows,
    [
      { label: "Material", value: "Brass" },
      { label: "Finish", value: "Gold tone" },
      { label: "Stone / detail", value: "Kundan" },
    ],
  );
});

test("product list query validates filters and caps pagination", () => {
  assert.deepEqual(productListQuerySchema.parse({ category: "jhumkas", limit: "12" }), {
    category: "jhumkas",
    sort: "featured",
    limit: 12,
  });
  assert.equal(productListQuerySchema.safeParse({ limit: "1000" }).success, false);
  assert.equal(productListQuerySchema.safeParse({ category: "../admin" }).success, false);
});

test("collection list query validates its optional limit without schema pick", () => {
  assert.deepEqual(collectionListQuerySchema.parse({ limit: "20" }), { limit: 20 });
  assert.deepEqual(collectionListQuerySchema.parse({}), { limit: 24 });
  assert.equal(collectionListQuerySchema.safeParse({ limit: "1000" }).success, false);
});

test("catalog discovery validates and normalizes shareable search filters", () => {
  assert.deepEqual(
    catalogDiscoveryQuerySchema.parse({
      q: "  kundan ",
      category: "jhumkas",
      parentCategory: "earrings",
      minPrice: "1000",
      maxPrice: "3000",
      occasion: "Festive",
      material: "Brass",
      finish: "Antique Gold",
      stoneType: "Kundan",
      color: "Gold",
      inStock: "true",
      sort: "price-asc",
      page: "2",
    }),
    {
      q: "kundan",
      category: "jhumkas",
      parentCategory: "earrings",
      minPrice: 1000,
      maxPrice: 3000,
      occasion: "Festive",
      material: "Brass",
      finish: "Antique Gold",
      stoneType: "Kundan",
      color: "Gold",
      inStock: true,
      sort: "price-asc",
      page: 2,
    },
  );
  assert.equal(
    catalogDiscoveryQuerySchema.safeParse({ minPrice: "3500", maxPrice: "1000" }).success,
    false,
  );
  assert.equal(catalogDiscoveryQuerySchema.safeParse({ occasion: "Wedding" }).success, false);
  assert.equal(catalogDiscoveryQuerySchema.safeParse({ category: "../admin" }).success, false);
  assert.equal(catalogDiscoveryQuerySchema.safeParse({ sort: "random" }).success, false);
  assert.equal(catalogDiscoveryQuerySchema.safeParse({ page: "1001" }).success, false);
  const emptyFilters = catalogDiscoveryQuerySchema.parse({
    occasion: "",
    inStock: "",
    minPrice: "",
  });
  assert.equal(emptyFilters.occasion, undefined);
  assert.equal(emptyFilters.inStock, undefined);
  assert.equal(emptyFilters.minPrice, undefined);
  assert.equal(emptyFilters.sort, "relevance");
  assert.equal(emptyFilters.page, 1);
  assert.equal(catalogDiscoveryQuerySchema.parse({ inStock: "false" }).inStock, false);
  assert.equal(catalogDiscoveryQuerySchema.safeParse({ color: "x".repeat(61) }).success, false);
});

test("variant availability validates bounded quantities and response stock", () => {
  assert.equal(
    variantAvailabilityRequestSchema.safeParse({
      variantId: "variant-1",
      quantity: 2,
    }).success,
    true,
  );
  assert.equal(
    variantAvailabilityRequestSchema.safeParse({
      variantId: "variant-1",
      quantity: 0,
    }).success,
    false,
  );
  assert.equal(
    variantAvailabilityRequestSchema.safeParse({
      variantId: "variant-1",
      quantity: 101,
    }).success,
    false,
  );
  assert.equal(
    variantAvailabilityResponseSchema.safeParse({
      variantId: "variant-1",
      sku: "TEST-AG",
      available: false,
      inventoryQuantity: 0,
      price: "1490.00",
    }).success,
    true,
  );
});

test("category and product writes reject malformed fields and unsafe URLs", () => {
  assert.equal(createCategorySchema.safeParse({ name: "ok", slug: "../x" }).success, false);
  assert.equal(
    createProductSchema.safeParse({
      ...validProduct,
      imageUrls: ["javascript:alert(1)"],
    }).success,
    false,
  );
  assert.equal(
    createProductSchema.safeParse({
      ...validProduct,
      variants: [{ ...validProduct.variants[0], compareAtPrice: 1000 }],
    }).success,
    false,
  );
  assert.equal(createProductSchema.safeParse(validProduct).success, true);
  const galleryUrls = ["/images/festival-earrings.jpg", "https://cdn.example.test/jhumkas-detail.jpg"];
  assert.deepEqual(
    createProductSchema.safeParse({ ...validProduct, imageUrls: galleryUrls }).data?.imageUrls,
    galleryUrls,
  );
  assert.deepEqual(
    updateAdminProductSchema.safeParse({ imageUrls: galleryUrls }).data?.imageUrls,
    galleryUrls,
  );
  assert.equal(
    updateAdminProductSchema.safeParse({ imageUrls: ["javascript:alert(1)"] }).success,
    false,
  );
  assert.equal(
    createProductSchema.safeParse({
      ...validProduct,
      imageUrls: Array.from({ length: 31 }, () => "/images/festival-earrings.jpg"),
    }).success,
    false,
  );
  assert.equal(
    createProductSchema.safeParse({
      ...validProduct,
      variants: [{ ...validProduct.variants[0], color: "Rose Gold" }],
    }).success,
    true,
  );
});

test("admin product image fields parse one URL per line", () => {
  assert.deepEqual(
    parseProductImageUrls(" /images/front.jpg \r\n\r\nhttps://cdn.example.test/detail.jpg\n"),
    ["/images/front.jpg", "https://cdn.example.test/detail.jpg"],
  );
});

test("login schema rejects invalid email and empty passwords", () => {
  assert.equal(adminLoginSchema.safeParse({ email: "nope", password: "secret" }).success, false);
  assert.equal(adminLoginSchema.safeParse({ email: "admin@example.com", password: "" }).success, false);
  assert.equal(
    adminLoginSchema.parse({ email: "ADMIN@example.com", password: "long-password" }).email,
    "admin@example.com",
  );
});

test("admin access requires an exact trusted origin and ADMIN role", () => {
  assert.equal(isAdminRole("ADMIN"), true);
  assert.equal(isAdminRole("CUSTOMER"), false);
  assert.equal(isSameOrigin("https://shringaar.example", "https://shringaar.example"), true);
  assert.equal(isSameOrigin("https://evil.example", "https://shringaar.example"), false);
  assert.equal(isSameOrigin(null, "https://shringaar.example"), false);
  assert.equal(
    isSameOriginAdminRole("https://shringaar.example", "https://shringaar.example", "CUSTOMER"),
    false,
  );
  assert.equal(isTrustedAdminRequest("GET", null, "https://shringaar.example"), true);
  assert.equal(isTrustedAdminRequest("PATCH", null, "https://shringaar.example"), false);
  assert.equal(
    isTrustedAdminRequest("PATCH", "https://shringaar.example", "https://shringaar.example"),
    true,
  );
});

test("checkout origin checks use the external request host behind a proxy", () => {
  assert.equal(
    isSameOriginRequest(
      new Request("http://internal-service/api/checkout", {
        method: "POST",
        headers: {
          origin: "https://shringaar.example",
          host: "shringaar.example",
          "x-forwarded-proto": "https",
        },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOriginRequest(
      new Request("http://shringaar.example/api/checkout", {
        method: "POST",
        headers: { origin: "https://attacker.example", host: "shringaar.example" },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOriginRequest(
      new Request("http://shringaar.example/api/checkout", {
        method: "POST",
        headers: { host: "shringaar.example" },
      }),
    ),
    false,
  );
});

test("legacy import adapter honors a PostgreSQL schema parameter", () => {
  assert.equal(
    getPostgresSchema("postgresql://user:pass@localhost:5432/store?schema=shringaar"),
    "shringaar",
  );
  assert.equal(
    getPostgresSchema("postgresql://user:pass@localhost:5432/store"),
    undefined,
  );
  assert.equal(
    getQualifiedPostgresTable(
      "postgresql://user:pass@localhost:5432/store?schema=shringaar",
      "Product",
    ),
    '"shringaar"."Product"',
  );
});
