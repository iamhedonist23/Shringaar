import { z } from "zod";

export const newsletterSignupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(254, "Email address is too long."),
  consent: z.literal(true, {
    error: "Please agree to receive email updates.",
  }),
});
