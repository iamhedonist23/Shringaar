import { z } from "zod";

const plainText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Remove unsupported characters.");

export const addressFieldsSchema = z.object({
  fullName: plainText(2, 120),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+91[- ]?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number."),
  addressLine1: plainText(4, 200),
  addressLine2: z
    .string()
    .trim()
    .max(200)
    .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Remove unsupported characters.")
    .optional()
    .or(z.literal("")),
  locality: plainText(2, 120),
  city: plainText(2, 100),
  state: plainText(2, 100),
  postalCode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code."),
  addressType: z.enum(["HOME", "WORK"]),
});

export const createAddressSchema = addressFieldsSchema.extend({
  isDefault: z.boolean().optional(),
}).strict();

export const updateAddressSchema = addressFieldsSchema.partial().extend({
  isDefault: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Update at least one address field.");

export const addressIdSchema = z.string().trim().min(1).max(128);
