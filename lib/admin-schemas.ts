import { z } from "zod";
import {
  createCategorySchema,
  createProductSchema,
  productImageUrlSchema,
  slugParamSchema,
} from "@/lib/catalog-schemas";

export const adminPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ]).optional(),
  shipmentStatus: z.enum([
    "PENDING",
    "PACKING",
    "READY_TO_SHIP",
    "SHIPPED",
    "IN_TRANSIT",
    "DELIVERED",
    "EXCEPTION",
    "RETURNED",
    "CANCELLED",
  ]).optional(),
  q: z.string().trim().max(100).optional(),
});

export const adminFulfillmentUpdateSchema = z.object({
  shipmentStatus: z.enum([
    "PENDING",
    "PACKING",
    "READY_TO_SHIP",
    "SHIPPED",
    "IN_TRANSIT",
    "DELIVERED",
    "EXCEPTION",
    "RETURNED",
    "CANCELLED",
  ]).optional(),
  trackingNumber: z.string().trim().min(1).max(120).nullable().optional(),
  carrierName: z.string().trim().min(1).max(120).nullable().optional(),
  customerName: z.string().trim().min(2).max(120).optional(),
  customerPhone: z.string().trim().min(7).max(30).optional(),
  addressLine1: z.string().trim().min(3).max(180).optional(),
  addressLine2: z.string().trim().max(180).nullable().optional(),
  city: z.string().trim().min(2).max(100).optional(),
  state: z.string().trim().min(2).max(100).optional(),
  postalCode: z.string().trim().min(3).max(20).optional(),
  country: z.string().trim().min(2).max(100).optional(),
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: "Provide at least one shipment or delivery-address field to update.",
});

export const adminIdSchema = z.string().trim().min(1).max(128);

export const createAdminProductSchema = createProductSchema.strict();

export const updateAdminProductSchema = z.object({
  name: z.string().trim().min(2).max(180).optional(),
  slug: slugParamSchema.optional(),
  description: z.string().trim().min(10).max(10000).optional(),
  shortDescription: z.string().trim().max(500).nullable().optional(),
  categoryId: z.string().trim().min(1).optional(),
  material: z.string().trim().min(2).max(120).optional(),
  plating: z.string().trim().min(2).max(120).optional(),
  stoneType: z.string().trim().max(120).nullable().optional(),
  occasions: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  imageUrls: z.array(productImageUrlSchema).min(1).max(30).optional(),
  seoTitle: z.string().trim().max(160).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: "Provide at least one product field to update.",
});

export const adminVariantUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  sku: z.string().trim().min(2).max(80).optional(),
  color: z.string().trim().min(1).max(60).nullable().optional(),
  options: z.record(z.string(), z.string()).optional(),
  price: z.number().finite().positive().max(10_000_000).optional(),
  compareAtPrice: z.number().finite().positive().max(10_000_000).nullable().optional(),
  inventoryQuantity: z.number().int().min(0).max(1_000_000).optional(),
  active: z.boolean().optional(),
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: "Provide at least one variant field to update.",
});

export const createAdminVariantSchema = z.object({
  sku: z.string().trim().min(2).max(80),
  name: z.string().trim().min(1).max(120),
  color: z.string().trim().min(1).max(60).optional(),
  options: z.record(z.string(), z.string()).optional(),
  price: z.number().finite().positive().max(10_000_000),
  compareAtPrice: z.number().finite().positive().max(10_000_000).optional(),
  inventoryQuantity: z.number().int().min(0).max(1_000_000).default(0),
  active: z.boolean().default(true),
}).strict().superRefine((variant, context) => {
  if (
    variant.compareAtPrice !== undefined &&
    variant.compareAtPrice < variant.price
  ) {
    context.addIssue({
      code: "custom",
      path: ["compareAtPrice"],
      message: "compareAtPrice must be greater than or equal to price.",
    });
  }
});

export const updateAdminCategorySchema = createCategorySchema.partial().strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one category field to update.",
  });

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "CANCELLED",
  ]),
}).strict();

export type AdminPageQuery = z.infer<typeof adminPageQuerySchema>;
