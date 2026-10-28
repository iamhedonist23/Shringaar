import "dotenv/config";
import { readFile } from "node:fs/promises";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type DocumentData, type WriteBatch } from "firebase-admin/firestore";
import { getMaintenanceFirebaseApp } from "@/scripts/firebase-admin";
import { z } from "zod";

const migrationSource = "postgres-v1";
const batchSize = 400;

type ImportDocument = {
  path: string;
  data: DocumentData;
};

function isApplyMode() {
  return process.argv.includes("--apply");
}

function isEmulatorMode() {
  return process.argv.includes("--emulator");
}

function isConfiguredDatabaseSource() {
  return process.argv.includes("--use-configured-database");
}

function isCatalogOnly() {
  return process.argv.includes("--catalog-only");
}

function confirmedProjectId() {
  return process.argv
    .find((argument) => argument.startsWith("--confirm-project="))
    ?.slice("--confirm-project=".length);
}

function addMigrationMarker(data: DocumentData): DocumentData {
  return { ...data, migrationSource };
}

function validateTarget() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("FIREBASE_ADMIN_PROJECT_ID is required.");
  }
  if (isEmulatorMode()) {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
    if (!emulatorHost || !/^(localhost|127\.0\.0\.1):\d+$/.test(emulatorHost)) {
      throw new Error(
        "--emulator requires FIRESTORE_EMULATOR_HOST to point to localhost or 127.0.0.1.",
      );
    }
  } else if (process.env.FIRESTORE_EMULATOR_HOST?.trim()) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is set; pass --emulator to make the destination explicit.",
    );
  }
  if (isApplyMode() && confirmedProjectId() !== projectId) {
    throw new Error(
      `Apply mode requires --confirm-project=${projectId} to match the configured Firebase project.`,
    );
  }
  return projectId;
}

async function verifyNoConflicts(
  firestore: ReturnType<typeof getFirestore>,
  documents: ImportDocument[],
) {
  for (let offset = 0; offset < documents.length; offset += batchSize) {
    const chunk = documents.slice(offset, offset + batchSize);
    const snapshots = await Promise.all(
      chunk.map(({ path }) => firestore.doc(path).get()),
    );
    const conflicting = snapshots.find(
      (snapshot) =>
        snapshot.exists &&
        snapshot.get("migrationSource") !== migrationSource,
    );
    if (conflicting) {
      throw new Error(
        `Refusing to overwrite existing Firestore document ${conflicting.ref.path}; reconcile it before importing.`,
      );
    }
  }
}

async function writeDocuments(
  firestore: ReturnType<typeof getFirestore>,
  documents: ImportDocument[],
) {
  for (let offset = 0; offset < documents.length; offset += batchSize) {
    const chunk = documents.slice(offset, offset + batchSize);
    const batch: WriteBatch = firestore.batch();
    chunk.forEach(({ path, data }) => {
      batch.set(firestore.doc(path), addMigrationMarker(data));
    });
    await batch.commit();
  }
}

async function main() {
  const projectId = validateTarget();
  const sourceUrl = process.env.SOURCE_DATABASE_URL?.trim() ||
    (isConfiguredDatabaseSource() ? process.env.DATABASE_URL?.trim() : undefined);
  if (!sourceUrl) {
    throw new Error(
      "Set SOURCE_DATABASE_URL, or pass --use-configured-database to import from DATABASE_URL in the local environment.",
    );
  }
  process.env.SOURCE_DATABASE_URL = sourceUrl;
  const uidMapPath = process.env.FIREBASE_UID_MAP_PATH?.trim();
  let firebaseUidByUserId = new Map<string, string>();
  if (uidMapPath) {
    const uidMapInput: unknown = JSON.parse(await readFile(uidMapPath, "utf8"));
    const parsedUidMap = z.record(z.string(), z.string().min(1)).safeParse(uidMapInput);
    if (!parsedUidMap.success) {
      throw new Error("FIREBASE_UID_MAP_PATH must contain a JSON object of legacy user IDs to Firebase UIDs.");
    }
    firebaseUidByUserId = new Map(
      Object.entries(parsedUidMap.data).map(([userId, uid]) => [userId, uid.trim()]),
    );
    if (
      [...firebaseUidByUserId.values()].some((uid) => !uid) ||
      new Set(firebaseUidByUserId.values()).size !== firebaseUidByUserId.size
    ) {
      throw new Error("The Firebase UID mapping must contain non-empty, unique Firebase UIDs.");
    }
  }

  const { getPrisma } = await import("@/scripts/postgres-source");
  const prisma = getPrisma();

  try {
    const catalogOnly = isCatalogOnly();
    const [
      users,
      categories,
      products,
      collections,
      customers,
      orders,
      auditLogs,
    ] = await Promise.all([
      catalogOnly
        ? Promise.resolve([])
        : prisma.user.findMany({ select: { id: true, firebaseUid: true } }),
      prisma.category.findMany(),
      prisma.product.findMany({
        include: {
          variants: true,
          collections: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.collection.findMany({
        include: { products: { orderBy: { sortOrder: "asc" } } },
      }),
      catalogOnly ? Promise.resolve([]) : prisma.customer.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          addresses: true,
        },
      }),
      catalogOnly ? Promise.resolve([]) : prisma.order.findMany({
        include: {
          items: true,
          payments: true,
          customer: {
            include: { user: { select: { id: true } } },
          },
        },
      }),
      catalogOnly ? Promise.resolve([]) : prisma.adminAuditLog.findMany({
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    if (!catalogOnly) {
      const userIds = new Set(users.map((user) => user.id));
      const unknownMappedUserIds = [...firebaseUidByUserId.keys()].filter(
        (userId) => !userIds.has(userId),
      );
      if (unknownMappedUserIds.length > 0) {
        throw new Error(
          `${unknownMappedUserIds.length} legacy user ID(s) in the Firebase UID mapping do not exist in PostgreSQL.`,
        );
      }
      for (const user of users) {
        if (user.firebaseUid && !firebaseUidByUserId.has(user.id)) {
          firebaseUidByUserId.set(user.id, user.firebaseUid);
        }
      }
      if (new Set(firebaseUidByUserId.values()).size !== firebaseUidByUserId.size) {
        throw new Error("Legacy user IDs resolve to duplicate Firebase UIDs.");
      }
      const customersWithoutUid = customers.filter(
        (customer) => !firebaseUidByUserId.has(customer.user.id),
      );
      if (customersWithoutUid.length > 0) {
        throw new Error(
          `${customersWithoutUid.length} customer account(s) have no Firebase UID. Link or re-register these users before importing.`,
        );
      }
      if (
        customers.some(
          (customer) =>
            customer.addresses.filter((address) => address.isDefault).length > 1,
        )
      ) {
        throw new Error(
          "A customer has multiple default addresses. Reconcile address defaults before importing.",
        );
      }
    }

    const documents: ImportDocument[] = [];

    for (const category of categories) {
      documents.push({
        path: `categories/${category.id}`,
        data: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          seoTitle: category.seoTitle,
          seoDescription: category.seoDescription,
          active: category.active,
          sortOrder: category.sortOrder,
          parentId: category.parentId,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
      });
    }

    for (const product of products) {
      documents.push({
        path: `products/${product.id}`,
        data: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          categoryId: product.categoryId,
          material: product.material,
          plating: product.plating,
          stoneType: product.stoneType,
          occasions: product.occasions,
          specifications: product.specifications,
          imageUrls: product.imageUrls,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          active: product.active,
          featured: product.featured,
          collectionIds: product.collections.map((entry) => entry.collectionId),
          variants: product.variants.map((variant) => ({
            id: variant.id,
            productId: product.id,
            sku: variant.sku,
            name: variant.name,
            color: variant.color,
            options: variant.options,
            price: Number(variant.price),
            compareAtPrice: variant.compareAtPrice === null
              ? null
              : Number(variant.compareAtPrice),
            inventoryQuantity: variant.inventoryQuantity,
            active: variant.active,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
          })),
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    }

    for (const collection of collections) {
      documents.push({
        path: `collections/${collection.id}`,
        data: {
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          imageUrl: collection.imageUrl,
          seoTitle: collection.seoTitle,
          seoDescription: collection.seoDescription,
          active: collection.active,
          sortOrder: collection.sortOrder,
          productIds: collection.products.map((entry) => entry.productId),
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        },
      });
    }

    for (const customer of customers) {
      const uid = firebaseUidByUserId.get(customer.user.id)!;
      documents.push({
        path: `customers/${uid}`,
        data: {
          uid,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          image: customer.user.image,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
      });
      for (const address of customer.addresses) {
        documents.push({
          path: `customers/${uid}/addresses/${address.id}`,
          data: {
            id: address.id,
            customerId: uid,
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            locality: address.locality,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            addressType: address.addressType,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
            updatedAt: address.updatedAt,
          },
        });
      }
    }

    for (const order of orders) {
      const customerUid = order.customer
        ? firebaseUidByUserId.get(order.customer.user.id) ?? null
        : null;
      if (order.customerId && !customerUid) {
        throw new Error(
          `Order ${order.id} references a customer without a Firebase UID mapping.`,
        );
      }
      documents.push({
        path: `orders/${order.id}`,
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          idempotencyKey: order.idempotencyKey,
          requestHash: order.requestHash,
          inventoryReserved: order.inventoryReserved,
          status: order.status,
          shipmentStatus: order.shipmentStatus,
          trackingNumber: order.trackingNumber,
          carrierName: order.carrierName,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          customerId: customerUid,
          addressLine1: order.addressLine1,
          addressLine2: order.addressLine2,
          locality: order.locality,
          city: order.city,
          state: order.state,
          postalCode: order.postalCode,
          country: order.country,
          subtotal: Number(order.subtotal),
          shippingAmount: Number(order.shippingAmount),
          taxAmount: Number(order.taxAmount),
          discountAmount: Number(order.discountAmount),
          total: Number(order.total),
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            imageUrl: item.imageUrl,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            lineTotal: Number(item.lineTotal),
            createdAt: item.createdAt,
          })),
          payments: order.payments.map((payment) => ({
            id: payment.id,
            method: payment.method,
            status: payment.status,
            amount: Number(payment.amount),
            currency: payment.currency,
            gatewayOrderId: payment.gatewayOrderId,
            gatewayPaymentId: payment.gatewayPaymentId,
            gatewayCheckoutUrl: payment.gatewayCheckoutUrl,
            statusTokenHash: payment.statusTokenHash,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
          })),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      });
      documents.push({
        path: `orderIdempotencyKeys/${order.idempotencyKey}`,
        data: { orderId: order.id },
      });
      for (const payment of order.payments) {
        if (payment.statusTokenHash) {
          documents.push({
            path: `paymentStatusTokens/${payment.statusTokenHash}`,
            data: { orderId: order.id, paymentId: payment.id },
          });
        }
      }
    }

    for (const audit of auditLogs) {
      documents.push({
        path: `adminAuditLogs/${audit.id}`,
        data: {
          id: audit.id,
          actorId: firebaseUidByUserId.get(audit.actorId) ?? audit.actorId,
          actorName: audit.actor.name,
          actorEmail: audit.actor.email,
          action: audit.action,
          entityType: audit.entityType,
          entityId: audit.entityId,
          before: audit.before,
          after: audit.after,
          createdAt: audit.createdAt,
        },
      });
    }

    const uniquePaths = new Set(documents.map(({ path }) => path));
    if (uniquePaths.size !== documents.length) {
      throw new Error("The source data contains duplicate destination document paths.");
    }

    const counts = {
      categories: categories.length,
      products: products.length,
      collections: collections.length,
    customers: catalogOnly ? "not included" : customers.length,
    addresses: catalogOnly ? "not included" : customers.reduce(
        (total, customer) => total + customer.addresses.length,
        0,
      ),
    orders: catalogOnly ? "not included" : orders.length,
    auditLogs: catalogOnly ? "not included" : auditLogs.length,
      firestoreDocuments: documents.length,
    ...(catalogOnly
      ? { omittedCollections: ["customers", "addresses", "orders", "payments", "adminAuditLogs"] }
      : {}),
    };

    if (!isApplyMode()) {
      console.info("Dry run complete. No Firestore documents were written.");
      console.info(JSON.stringify({
        destination: isEmulatorMode()
          ? `Firestore emulator (${process.env.FIRESTORE_EMULATOR_HOST})`
          : "Firebase Cloud Firestore",
        projectId,
        counts,
      }, null, 2));
      console.info(
        `To import, rerun with --apply --confirm-project=${projectId}${isEmulatorMode() ? " --emulator" : ""} after reviewing the data and Firebase UID links.`,
      );
      return;
    }

    const app = getMaintenanceFirebaseApp();
    if (!isEmulatorMode()) {
      const auth = getAuth(app);
      const missingAuthUsers: string[] = [];
      for (const customer of customers) {
        const uid = firebaseUidByUserId.get(customer.user.id)!;
        try {
          await auth.getUser(uid);
        } catch (error: unknown) {
          if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "auth/user-not-found"
          ) {
            missingAuthUsers.push(uid);
          } else {
            throw error;
          }
        }
      }
      if (missingAuthUsers.length > 0) {
        throw new Error(
          `${missingAuthUsers.length} Firebase Auth user(s) are missing. Resolve identity links before importing.`,
        );
      }
    }

    const firestore = getFirestore(app);
    firestore.settings({ ignoreUndefinedProperties: true });
    await verifyNoConflicts(firestore, documents);
    await writeDocuments(firestore, documents);
    console.info("Firestore import completed.");
    console.info(JSON.stringify({ projectId, counts }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("PostgreSQL to Firestore import failed:", error);
  process.exitCode = 1;
});
