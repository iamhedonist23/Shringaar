import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { firestoreDate, snapshotData } from "@/lib/firestore/records";
import type {
  CustomerAddressRecord,
  CustomerRecord,
} from "@/lib/firestore/types";

const customers = "customers";

function addressCollection(customerId: string) {
  return getFirestoreDb().collection(customers).doc(customerId).collection("addresses");
}

function customerFromData(
  id: string,
  data: DocumentData,
): CustomerRecord {
  return {
    uid: id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    image: data.image ?? null,
    createdAt: firestoreDate(data.createdAt),
    updatedAt: firestoreDate(data.updatedAt),
  };
}

function addressFromData(
  id: string,
  data: DocumentData,
): CustomerAddressRecord {
  return {
    id,
    customerId: data.customerId,
    fullName: data.fullName,
    phone: data.phone,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2 ?? null,
    locality: data.locality,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    addressType: data.addressType,
    isDefault: data.isDefault,
    createdAt: firestoreDate(data.createdAt),
    updatedAt: firestoreDate(data.updatedAt),
  };
}

export async function getCustomer(uid: string): Promise<CustomerRecord | null> {
  const snapshot = await getFirestoreDb().collection(customers).doc(uid).get();
  const data = snapshotData(snapshot);
  return data ? customerFromData(uid, data) : null;
}

export async function upsertCustomer(input: {
  uid: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
}): Promise<CustomerRecord> {
  const reference = getFirestoreDb().collection(customers).doc(input.uid);
  const existing = await reference.get();
  const now = new Date();
  const next = {
    uid: input.uid,
    name: input.name,
    email: input.email,
    phone: input.phone ?? existing.get("phone") ?? null,
    image: input.image ?? null,
    createdAt: existing.get("createdAt") ?? now,
    updatedAt: now,
  };
  await reference.set(next, { merge: true });
  return customerFromData(input.uid, next);
}

export async function updateCustomerPhone(uid: string, phone: string) {
  await getFirestoreDb().collection(customers).doc(uid).set(
    { phone, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function listCustomerAddresses(
  customerId: string,
): Promise<CustomerAddressRecord[]> {
  const snapshot = await addressCollection(customerId).get();
  return snapshot.docs
    .map((document) => addressFromData(document.id, document.data()))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getCustomerAddress(
  customerId: string,
  addressId: string,
): Promise<CustomerAddressRecord | null> {
  const snapshot = await addressCollection(customerId).doc(addressId).get();
  const data = snapshotData(snapshot);
  return data ? addressFromData(addressId, data) : null;
}

export async function createCustomerAddress(
  customerId: string,
  input: Omit<CustomerAddressRecord, "id" | "customerId" | "createdAt" | "updatedAt">,
): Promise<CustomerAddressRecord> {
  const db = getFirestoreDb();
  const collection = addressCollection(customerId);
  const id = randomUUID();
  const reference = collection.doc(id);
  const result = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(collection);
    const hasDefault = existing.docs.some((document) => document.get("isDefault") === true);
    const isDefault = input.isDefault || !hasDefault;
    if (isDefault) {
      existing.docs
        .filter((document) => document.get("isDefault") === true)
        .forEach((document) => {
          transaction.update(document.ref, {
            isDefault: false,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
    }

    const now = new Date();
    const record = {
      ...input,
      id,
      customerId,
      isDefault,
      createdAt: now,
      updatedAt: now,
    };
    transaction.create(reference, record);
    return record;
  });
  return result;
}

export async function updateCustomerAddress(
  customerId: string,
  addressId: string,
  fields: Partial<Omit<CustomerAddressRecord, "id" | "customerId" | "createdAt" | "updatedAt">>,
): Promise<CustomerAddressRecord | null> {
  const db = getFirestoreDb();
  const collection = addressCollection(customerId);
  const reference = collection.doc(addressId);
  return db.runTransaction(async (transaction) => {
    const [existing, allAddresses] = await Promise.all([
      transaction.get(reference),
      transaction.get(collection),
    ]);
    const before = snapshotData(existing);
    if (!before) return null;
    const others = allAddresses.docs.filter((document) => document.id !== addressId);
    const currentHasDefault = allAddresses.docs.some(
      (document) => document.get("isDefault") === true,
    );
    const replacement =
      fields.isDefault === false && before.isDefault
        ? others
            .slice()
            .sort((a, b) => {
              const aCreated = firestoreDate(a.get("createdAt")).getTime();
              const bCreated = firestoreDate(b.get("createdAt")).getTime();
              return aCreated - bCreated || a.id.localeCompare(b.id);
            })[0]
        : undefined;
    const isDefault = fields.isDefault === true
      ? true
      : fields.isDefault === false
        ? before.isDefault
          ? !replacement
          : !currentHasDefault
        : before.isDefault || !currentHasDefault;

    if (isDefault) {
      allAddresses.docs
        .filter((document) => document.id !== addressId && document.get("isDefault") === true)
        .forEach((document) => {
          transaction.update(document.ref, {
            isDefault: false,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
    }
    if (replacement) {
      transaction.update(replacement.ref, {
        isDefault: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    const updated = {
      ...before,
      ...fields,
      isDefault,
      addressLine2:
        fields.addressLine2 === undefined ? before.addressLine2 ?? null : fields.addressLine2 || null,
      updatedAt: new Date(),
    };
    transaction.set(reference, updated, { merge: true });
    return addressFromData(addressId, updated);
  });
}

export async function deleteCustomerAddress(
  customerId: string,
  addressId: string,
): Promise<boolean> {
  const db = getFirestoreDb();
  const collection = addressCollection(customerId);
  return db.runTransaction(async (transaction) => {
    const [existing, allAddresses] = await Promise.all([
      transaction.get(collection.doc(addressId)),
      transaction.get(collection),
    ]);
    if (!existing.exists) return false;
    const wasDefault = existing.get("isDefault") === true;
    transaction.delete(existing.ref);

    if (wasDefault) {
      const replacement = allAddresses.docs
        .filter((document) => document.id !== addressId)
        .sort((a, b) => {
          const aCreated = firestoreDate(a.get("createdAt")).getTime();
          const bCreated = firestoreDate(b.get("createdAt")).getTime();
          return aCreated - bCreated || a.id.localeCompare(b.id);
        })[0];
      if (replacement) {
        transaction.update(replacement.ref, {
          isDefault: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    return true;
  });
}
