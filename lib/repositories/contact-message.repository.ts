import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { ContactMessage } from "@/lib/contact-schema";

const collectionName = "contactMessages";

export type ContactMessageRecord = ContactMessage & {
  id: string;
  createdAt: Date;
};

function contactMessageRecord(
  id: string,
  data: FirebaseFirestore.DocumentData,
): ContactMessageRecord {
  const createdAt = data.createdAt;
  if (!(createdAt instanceof Timestamp)) {
    throw new Error(`Contact message ${id} is missing a valid creation timestamp.`);
  }
  return {
    id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    orderNumber: String(data.orderNumber ?? ""),
    message: String(data.message ?? ""),
    createdAt: createdAt.toDate(),
  };
}

export async function createContactMessage(
  message: Omit<ContactMessage, "website">,
) {
  const reference = getFirebaseAdminFirestore().collection(collectionName).doc();
  await reference.create({
    name: message.name,
    email: message.email,
    orderNumber: message.orderNumber,
    message: message.message,
    createdAt: Timestamp.now(),
  });
  return reference.id;
}

export async function listContactMessages(limit = 100) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collectionName)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((document) =>
    contactMessageRecord(document.id, document.data()),
  );
}
