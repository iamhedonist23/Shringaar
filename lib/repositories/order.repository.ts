import { FieldValue, Timestamp, type DocumentData, type Transaction } from "firebase-admin/firestore";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { firestoreDate } from "@/lib/firestore/records";
import type {
  AdminAuditRecord,
  OrderRecord,
  OrderStatus,
} from "@/lib/firestore/types";
import { canAdminTransitionOrder } from "@/lib/admin-order-transitions";
import {
  canEditShippingAddress,
  canTransitionShipment,
  SHIPMENT_ADDRESS_FIELDS,
} from "@/lib/admin-shipment";
import type { AdminPageQuery, adminFulfillmentUpdateSchema } from "@/lib/admin-schemas";
import type { z } from "zod";

const orders = "orders";
const auditLogs = "adminAuditLogs";

export type AdminActor = {
  id: string;
  name: string;
  email: string;
};

function orderRecord(id: string, data: DocumentData): OrderRecord {
  return {
    ...data,
    id,
    items: data.items ?? [],
    payments: (data.payments ?? []).map((payment: DocumentData) => ({
      ...payment,
      createdAt: firestoreDate(payment.createdAt),
      updatedAt: firestoreDate(payment.updatedAt),
    })),
    createdAt: firestoreDate(data.createdAt),
    updatedAt: firestoreDate(data.updatedAt),
  } as OrderRecord;
}

function auditRecord(id: string, data: DocumentData): AdminAuditRecord {
  return {
    ...data,
    id,
    createdAt: firestoreDate(data.createdAt),
  } as AdminAuditRecord;
}

function addAudit(
  transaction: Transaction,
  actor: AdminActor,
  action: string,
  entityId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  const reference = getFirestoreDb().collection(auditLogs).doc();
  transaction.create(reference, {
    id: reference.id,
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    action,
    entityType: "ORDER",
    entityId,
    before,
    after,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function listCustomerOrders(customerId: string, limit?: number) {
  const snapshot = await getFirestoreDb()
    .collection(orders)
    .where("customerId", "==", customerId)
    .get();
  const sorted = snapshot.docs
    .map((document) => orderRecord(document.id, document.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return limit === undefined ? sorted : sorted.slice(0, limit);
}

export async function listAdminOrders(
  query: Pick<AdminPageQuery, "page" | "status" | "shipmentStatus" | "q">,
) {
  const snapshot = await getFirestoreDb().collection(orders).get();
  const search = query.q?.toLocaleLowerCase();
  const matching = snapshot.docs
    .map((document) => orderRecord(document.id, document.data()))
    .filter((order) =>
      (!query.status || order.status === query.status) &&
      (!query.shipmentStatus || order.shipmentStatus === query.shipmentStatus) &&
      (!search || [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.customerPhone,
      ].some((value) => value.toLocaleLowerCase().includes(search))),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id));
  const pageSize = 25;
  return {
    orders: matching
      .slice((query.page - 1) * pageSize, query.page * pageSize)
      .map((order) => ({
        ...order,
        _count: { items: order.items.length },
      })),
    page: query.page,
    pageSize,
    total: matching.length,
    totalPages: Math.ceil(matching.length / pageSize),
  };
}

export async function getAdminOrderDetails(id: string) {
  const db = getFirestoreDb();
  const [snapshot, auditSnapshot] = await Promise.all([
    db.collection(orders).doc(id).get(),
    db.collection(auditLogs)
      .where("entityType", "==", "ORDER")
      .where("entityId", "==", id)
      .get(),
  ]);
  if (!snapshot.exists) return null;
  const auditLog = auditSnapshot.docs
    .map((document) => ({
      ...auditRecord(document.id, document.data()),
      actor: {
        name: document.get("actorName") ?? document.get("actorId") ?? "Admin",
        email: document.get("actorEmail") ?? "",
      },
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50);
  return { order: orderRecord(snapshot.id, snapshot.data()!), auditLog };
}

export async function getOrderRecord(id: string) {
  const snapshot = await getFirestoreDb().collection(orders).doc(id).get();
  return snapshot.exists ? orderRecord(snapshot.id, snapshot.data()!) : null;
}

export async function updateOrderPayment(
  orderId: string,
  paymentId: string,
  paymentFields: Partial<OrderRecord["payments"][number]>,
  orderFields: Partial<OrderRecord>,
) {
  const db = getFirestoreDb();
  const reference = db.collection(orders).doc(orderId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new Error("Order not found while updating payment.");
    const current = orderRecord(snapshot.id, snapshot.data()!);
    const payments = current.payments.map((payment) =>
      payment.id === paymentId
        ? { ...payment, ...paymentFields, updatedAt: Timestamp.now() }
        : payment,
    );
    if (!payments.some((payment) => payment.id === paymentId)) {
      throw new Error("Payment record was not found on its order.");
    }
    transaction.update(reference, {
      ...orderFields,
      payments,
      updatedAt: Timestamp.now(),
    });
  });
}

export async function getOrderForPaymentStatusToken(statusTokenHash: string) {
  const db = getFirestoreDb();
  const tokenSnapshot = await db
    .collection("paymentStatusTokens")
    .doc(statusTokenHash)
    .get();
  if (!tokenSnapshot.exists) return null;
  const orderId = tokenSnapshot.get("orderId");
  const paymentId = tokenSnapshot.get("paymentId");
  if (typeof orderId !== "string" || typeof paymentId !== "string") {
    throw new Error("Payment status token index is malformed.");
  }
  const order = await getOrderRecord(orderId);
  const payment = order?.payments.find((item) => item.id === paymentId) ?? null;
  return order && payment ? { order, payment } : null;
}

export async function applyUroPayProviderStatus(
  orderId: string,
  paymentId: string,
  providerStatus: "PAID" | "FAILED" | "EXPIRED" | "CANCELLED" | "REFUNDED",
) {
  const db = getFirestoreDb();
  const reference = db.collection(orders).doc(orderId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new Error("Order not found while updating payment.");
    const current = orderRecord(snapshot.id, snapshot.data()!);
    const payment = current.payments.find((item) => item.id === paymentId);
    if (!payment || payment.method !== "UROPAY") {
      throw new Error("UroPay payment record was not found on its order.");
    }

    let orderStatus = current.status;
    let paymentStatus = current.paymentStatus;
    let inventoryReserved = current.inventoryReserved;
    let inventoryNeedsReview = false;
    let nextPaymentStatus = payment.status;

    if (providerStatus === "PAID") {
      if (payment.status !== "PAID" && payment.status !== "REFUNDED") {
        const confirmable =
          current.status === "PENDING" && current.inventoryReserved;
        paymentStatus = "PAID";
        nextPaymentStatus = "PAID";
        if (confirmable) orderStatus = "CONFIRMED";
        inventoryNeedsReview = !confirmable;
      }
    } else if (
      ["FAILED", "EXPIRED", "CANCELLED"].includes(providerStatus) &&
      payment.status === "PENDING"
    ) {
      const releaseInventory =
        current.status === "PENDING" &&
        current.paymentStatus === "PENDING" &&
        current.inventoryReserved;
      if (releaseInventory) {
        await variantUpdates(transaction, current, false);
        inventoryReserved = false;
      }
      paymentStatus = "FAILED";
      nextPaymentStatus = "FAILED";
    } else if (
      providerStatus === "REFUNDED" &&
      payment.status !== "REFUNDED"
    ) {
      paymentStatus = "REFUNDED";
      nextPaymentStatus = "REFUNDED";
    }

    const now = Timestamp.now();
    const payments = current.payments.map((item) =>
      item.id === paymentId
        ? { ...item, status: nextPaymentStatus, updatedAt: now.toDate() }
        : item,
    );
    transaction.update(reference, {
      paymentStatus,
      status: orderStatus,
      inventoryReserved,
      payments,
      updatedAt: now,
    });
    return {
      paymentStatus: nextPaymentStatus,
      orderStatus,
      inventoryNeedsReview,
    };
  });
}

async function variantUpdates(
  transaction: Transaction,
  order: OrderRecord,
  reserve: boolean,
) {
  const db = getFirestoreDb();
  const quantities = new Map<string, number>();
  for (const item of order.items) {
    const key = `${item.productId}\u0000${item.variantId}`;
    quantities.set(key, (quantities.get(key) ?? 0) + item.quantity);
  }
  const entries = [...quantities.entries()].sort(([a], [b]) => a.localeCompare(b));
  const productIds = [...new Set(entries.map(([key]) => key.split("\u0000")[0]))];
  const snapshots = await Promise.all(
    productIds.map((id) => transaction.get(db.collection("products").doc(id))),
  );
  const dataByProduct = new Map(
    snapshots.map((snapshot) => [snapshot.id, snapshot.data()]),
  );
  const updates = new Map<string, Array<Record<string, unknown>>>();
  const now = Timestamp.now();
  for (const [key, quantity] of entries) {
    const [productId, variantId] = key.split("\u0000");
    const data = dataByProduct.get(productId);
    if (!data) throw new OrderInventoryUnavailableError();
    const variants = (data.variants ?? []) as Array<Record<string, unknown>>;
    const variantIndex = variants.findIndex((variant) => variant.id === variantId);
    if (variantIndex < 0) throw new OrderInventoryUnavailableError();
    const variant = variants[variantIndex]!;
    const inventoryQuantity = Number(variant.inventoryQuantity);
    if (reserve && inventoryQuantity < quantity) {
      throw new OrderInventoryUnavailableError();
    }
    updates.set(
      productId,
      variants.map((item, index) =>
        index === variantIndex
          ? {
              ...item,
              inventoryQuantity: reserve
                ? inventoryQuantity - quantity
                : inventoryQuantity + quantity,
              updatedAt: now,
            }
          : item,
      ),
    );
  }
  for (const [productId, variants] of updates) {
    transaction.update(db.collection("products").doc(productId), {
      variants,
      updatedAt: now,
    });
  }
}

export class OrderInventoryUnavailableError extends Error {}

export async function updateAdminOrderStatus(
  id: string,
  status: OrderStatus,
  actor: AdminActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(orders).doc(id);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return { missing: true as const };
    const before = orderRecord(snapshot.id, snapshot.data()!);
    if (before.status === status) return { order: before, unchanged: true as const };
    if (!canAdminTransitionOrder(before.status, status)) {
      return { invalidTransition: true as const, from: before.status, to: status };
    }
    if (status === "CANCELLED" && before.paymentStatus === "PAID") {
      return { paidCancellation: true as const };
    }
    if (
      status === "CANCELLED" &&
      !["PENDING", "PACKING", "READY_TO_SHIP", "CANCELLED"].includes(before.shipmentStatus)
    ) {
      return { dispatchedCancellation: true as const };
    }
    if (status === "CONFIRMED" && before.paymentMethod === "UROPAY" && before.paymentStatus !== "PAID") {
      return { unpaidUroPay: true as const };
    }

    const releaseInventory = status === "CANCELLED" && before.inventoryReserved;
    const reserveInventory =
      status === "CONFIRMED" &&
      before.paymentMethod === "UROPAY" &&
      before.status === "PENDING" &&
      !before.inventoryReserved;
    if (releaseInventory || reserveInventory) {
      await variantUpdates(transaction, before, reserveInventory);
    }
    const updated: OrderRecord = {
      ...before,
      status,
      ...(reserveInventory ? { inventoryReserved: true } : {}),
      ...(status === "CANCELLED"
        ? { shipmentStatus: "CANCELLED" as const, inventoryReserved: false }
        : {}),
      updatedAt: new Date(),
    };
    transaction.update(reference, {
      status: updated.status,
      shipmentStatus: updated.shipmentStatus,
      inventoryReserved: updated.inventoryReserved,
      updatedAt: Timestamp.now(),
    });
    addAudit(
      transaction,
      actor,
      "STATUS_UPDATE",
      before.id,
      {
        status: before.status,
        paymentStatus: before.paymentStatus,
        shipmentStatus: before.shipmentStatus,
      },
      {
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        shipmentStatus: updated.shipmentStatus,
      },
    );
    return { order: updated };
  });
}

export type FulfillmentUpdate = z.infer<typeof adminFulfillmentUpdateSchema>;

function fulfillmentSnapshot(order: OrderRecord) {
  return {
    shipmentStatus: order.shipmentStatus,
    trackingNumber: order.trackingNumber,
    carrierName: order.carrierName,
    shippingAddress: {
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.city,
      state: order.state,
      postalCode: order.postalCode,
      country: order.country,
    },
  };
}

export async function updateAdminOrderFulfillment(
  id: string,
  update: FulfillmentUpdate,
  actor: AdminActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(orders).doc(id);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return { missing: true as const };
    const before = orderRecord(snapshot.id, snapshot.data()!);
    if (
      update.shipmentStatus &&
      update.shipmentStatus !== before.shipmentStatus &&
      !canTransitionShipment(before.shipmentStatus, update.shipmentStatus)
    ) {
      return {
        invalidTransition: true as const,
        from: before.shipmentStatus,
        to: update.shipmentStatus,
      };
    }
    if (
      before.status === "CANCELLED" &&
      update.shipmentStatus &&
      update.shipmentStatus !== "CANCELLED"
    ) {
      return { orderCancelled: true as const };
    }
    if (
      update.shipmentStatus &&
      ["READY_TO_SHIP", "SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(update.shipmentStatus) &&
      before.paymentMethod !== "COD" &&
      before.paymentStatus !== "PAID"
    ) {
      return { paymentPending: true as const };
    }
    const shipmentTarget = update.shipmentStatus;
    if (
      shipmentTarget === "SHIPPED" &&
      shipmentTarget !== before.shipmentStatus &&
      before.status !== "PROCESSING"
    ) {
      return { orderStatusConflict: true as const };
    }
    if (
      shipmentTarget === "IN_TRANSIT" &&
      shipmentTarget !== before.shipmentStatus &&
      before.status !== "SHIPPED"
    ) {
      return { orderStatusConflict: true as const };
    }
    if (
      shipmentTarget === "DELIVERED" &&
      shipmentTarget !== before.shipmentStatus &&
      before.status !== "SHIPPED"
    ) {
      return { orderStatusConflict: true as const };
    }
    if (
      shipmentTarget === "RETURNED" &&
      shipmentTarget !== before.shipmentStatus &&
      !["SHIPPED", "DELIVERED"].includes(before.status)
    ) {
      return { orderStatusConflict: true as const };
    }

    const changesAddress = SHIPMENT_ADDRESS_FIELDS.some(
      (field) => field in update && update[field] !== before[field],
    );
    if (changesAddress && !canEditShippingAddress(before.shipmentStatus)) {
      return { addressLocked: true as const };
    }
    const updated = {
      ...before,
      ...update,
      ...(shipmentTarget === "SHIPPED" ? { status: "SHIPPED" as const } : {}),
      ...(shipmentTarget === "DELIVERED" ? { status: "DELIVERED" as const } : {}),
      ...(shipmentTarget === "RETURNED" ? { status: "RETURNED" as const } : {}),
      updatedAt: new Date(),
    };
    transaction.update(reference, {
      ...update,
      ...(shipmentTarget === "SHIPPED" ? { status: "SHIPPED" } : {}),
      ...(shipmentTarget === "DELIVERED" ? { status: "DELIVERED" } : {}),
      ...(shipmentTarget === "RETURNED" ? { status: "RETURNED" } : {}),
      updatedAt: Timestamp.now(),
    });
    addAudit(
      transaction,
      actor,
      "FULFILLMENT_UPDATE",
      id,
      fulfillmentSnapshot(before),
      fulfillmentSnapshot(updated),
    );
    return { order: updated };
  });
}
