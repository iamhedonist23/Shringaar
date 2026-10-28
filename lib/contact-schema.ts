import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(254),
  orderNumber: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().min(10, "Please include a little more detail.").max(5000),
  website: z.string().max(200).optional().default(""),
}).strict();

export type ContactMessage = Omit<
  z.infer<typeof contactMessageSchema>,
  "website"
>;
