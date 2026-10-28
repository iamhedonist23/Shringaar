import "server-only";

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export function getAdminAuth() {
  return getFirebaseAdminAuth();
}
