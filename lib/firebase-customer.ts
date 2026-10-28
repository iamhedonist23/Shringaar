import type { DecodedIdToken } from "firebase-admin/auth";
import { upsertCustomer } from "@/lib/repositories/customer.repository";

export class FirebaseCustomerIdentityError extends Error {}

export async function syncFirebaseCustomer(decodedToken: DecodedIdToken) {
  const email = decodedToken.email?.trim().toLowerCase();
  if (!email || decodedToken.email_verified !== true) {
    throw new FirebaseCustomerIdentityError("A verified email address is required.");
  }
  if (decodedToken.admin === true) {
    throw new FirebaseCustomerIdentityError("Admin accounts cannot use customer sign-in.");
  }

  const name =
    decodedToken.name?.trim() || email.split("@")[0] || "Shringaar customer";
  const image = typeof decodedToken.picture === "string" ? decodedToken.picture : null;
  const customer = await upsertCustomer({
    uid: decodedToken.uid,
    name,
    email,
    image,
  });
  return {
    id: customer.uid,
    name: customer.name,
    email: customer.email,
    image: customer.image,
  };
}
