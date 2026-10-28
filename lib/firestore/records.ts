import { Timestamp, type DocumentSnapshot, type DocumentData } from "firebase-admin/firestore";

export function firestoreDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  throw new Error("Firestore record contains an invalid timestamp.");
}

export function snapshotData<T extends DocumentData>(
  snapshot: DocumentSnapshot,
): (T & { id: string }) | null {
  if (!snapshot.exists) return null;
  return { ...snapshot.data(), id: snapshot.id } as T & { id: string };
}
