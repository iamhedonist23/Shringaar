import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export function getFirestoreDb() {
  return getFirebaseAdminFirestore();
}
