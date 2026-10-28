import { z } from "zod";

export const cartLineSchema = z
  .object({
    productId: z.string().trim().min(1).max(128),
    variantId: z.string().trim().min(1).max(128),
    quantity: z.number().int().min(1).max(99),
  })
  .strict();

export const cartLinesSchema = z
  .array(cartLineSchema)
  .min(1)
  .max(50)
  .superRefine((lines, context) => {
    const seen = new Set<string>();
    for (const [index, line] of lines.entries()) {
      const key = `${line.productId}\u0000${line.variantId}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: "A product variant can only appear once in the cart.",
        });
      }
      seen.add(key);
    }
  });

export const cartQuoteRequestSchema = z
  .object({ lines: cartLinesSchema })
  .strict();

const moneySchema = z.string().regex(/^\d+\.\d{2}$/);

const cartQuoteLineSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  quantity: z.number().int(),
  status: z.enum(["available", "out-of-stock", "unavailable"]),
  productName: z.string().nullable(),
  productSlug: z.string().nullable(),
  imageUrl: z.string().nullable(),
  variantName: z.string().nullable(),
  sku: z.string().nullable(),
  inventoryQuantity: z.number().int().nullable(),
  unitPrice: moneySchema.nullable(),
  lineTotal: moneySchema.nullable(),
});

export const cartQuoteResponseSchema = z.object({
  lines: z.array(cartQuoteLineSchema),
  subtotal: moneySchema,
  shipping: moneySchema,
  tax: z.literal("0.00"),
  discount: z.literal("0.00"),
  total: moneySchema,
  canCheckout: z.boolean(),
});

export const checkoutResponseSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED"]),
  paymentStatus: z.literal("PENDING"),
  paymentMethod: z.enum(["COD", "UROPAY"]),
  total: z.string().regex(/^\d+\.\d{2}$/),
  checkoutUrl: z.url().optional(),
});

export const checkoutFailureSchema = z.object({
  error: z.string().optional(),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export const uroPayPaymentStatusSchema = z.object({
  orderNumber: z.string().min(1),
  amount: moneySchema,
  providerStatus: z.enum([
    "PENDING",
    "PAID",
    "FAILED",
    "EXPIRED",
    "CANCELLED",
    "REFUNDED",
  ]),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]),
  orderStatus: z.string().min(1),
  inventoryNeedsReview: z.boolean(),
});

export const checkoutRequestSchema = z
  .object({
    paymentMethod: z.enum(["COD", "UROPAY"]),
    paymentStatusToken: z.uuid().optional(),
    lines: cartLinesSchema,
    customer: z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.email().max(254).transform((email) => email.toLowerCase()),
        phone: z
          .string()
          .trim()
          .regex(/^(?:\+91[- ]?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number."),
      })
      .strict(),
    address: z
      .object({
        line1: z.string().trim().min(4).max(200),
        line2: z.string().trim().max(200).optional(),
        locality: z.string().trim().min(2).max(120).optional(),
        city: z.string().trim().min(2).max(100),
        state: z.string().trim().min(2).max(100),
        postalCode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code."),
        country: z.literal("India"),
      })
      .strict(),
    addressId: z.string().trim().min(1).max(128).optional(),
    saveAddress: z.boolean().optional(),
    addressType: z.enum(["HOME", "WORK"]).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.paymentMethod === "UROPAY" && !input.paymentStatusToken) {
      context.addIssue({
        code: "custom",
        path: ["paymentStatusToken"],
        message: "A payment status token is required for online checkout.",
      });
    }
    if (input.paymentMethod === "COD" && input.paymentStatusToken) {
      context.addIssue({
        code: "custom",
        path: ["paymentStatusToken"],
        message: "A payment status token is only valid for online checkout.",
      });
    }
    if (input.saveAddress && !input.address.locality) {
      context.addIssue({
        code: "custom",
        path: ["address", "locality"],
        message: "Enter a locality to save this address.",
      });
    }
  });

export const idempotencyKeySchema = z.uuid();

export type CartLineInput = z.infer<typeof cartLineSchema>;
export type CartQuoteResponse = z.infer<typeof cartQuoteResponseSchema>;
export type CheckoutInput = z.infer<typeof checkoutRequestSchema>;
