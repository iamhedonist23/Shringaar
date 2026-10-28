import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Transaction,
} from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { firestoreDate } from "@/lib/firestore/records";
import type {
  CategoryRecord,
  CollectionRecord,
  ProductRecord,
  ProductVariantRecord,
} from "@/lib/firestore/types";
import type {
  CreateCategoryInput,
  CreateCollectionInput,
  CreateProductInput,
} from "@/lib/catalog-schemas";

const categories = "categories";
const collections = "collections";
const products = "products";

export class FirestoreUniqueValueError extends Error {}
export class FirestoreReferencedRecordError extends Error {}

export type ProductAuditActor =
  | string
  | { id: string; name: string; email: string };

function documentRecord<T extends { id: string; createdAt: Date; updatedAt: Date }>(
  id: string,
  data: DocumentData,
): T {
  return {
    ...data,
    id,
    createdAt: firestoreDate(data.createdAt),
    updatedAt: firestoreDate(data.updatedAt),
  } as T;
}

function variantRecord(
  productId: string,
  data: DocumentData,
): ProductVariantRecord {
  return {
    ...data,
    productId,
    color: data.color ?? null,
    options: data.options ?? null,
    compareAtPrice: data.compareAtPrice ?? null,
    createdAt: firestoreDate(data.createdAt),
    updatedAt: firestoreDate(data.updatedAt),
  } as ProductVariantRecord;
}

function productRecord(
  id: string,
  data: DocumentData,
): ProductRecord {
  return {
    ...data,
    id,
    shortDescription: data.shortDescription ?? null,
    stoneType: data.stoneType ?? null,
    specifications: data.specifications ?? null,
    seoTitle: data.seoTitle ?? null,
    seoDescription: data.seoDescription ?? null,
    occasions: data.occasions ?? [],
    imageUrls: data.imageUrls ?? [],
    collectionIds: data.collectionIds ?? [],
    variants: (data.variants ?? []).map((variant: DocumentData) =>
      variantRecord(id, variant),
    ),
    createdAt: firestoreDate(data.createdAt),
    updatedAt: firestoreDate(data.updatedAt),
  } as ProductRecord;
}

export async function listProductsFromFirestore(
  includeInactive = false,
): Promise<ProductRecord[]> {
  const snapshot = await getFirestoreDb().collection(products).get();
  return snapshot.docs
    .map((document) => productRecord(document.id, document.data()))
    .filter((product) => includeInactive || product.active);
}

export async function getProductRecord(id: string): Promise<ProductRecord | null> {
  const snapshot = await getFirestoreDb().collection(products).doc(id).get();
  return snapshot.exists ? productRecord(snapshot.id, snapshot.data()!) : null;
}

export async function findProductRecordBySlug(
  slug: string,
): Promise<ProductRecord | null> {
  const snapshot = await getFirestoreDb()
    .collection(products)
    .where("slug", "==", slug)
    .limit(1)
    .get();
  const document = snapshot.docs[0];
  return document ? productRecord(document.id, document.data()) : null;
}

export async function listCategoryRecords(
  includeInactive = false,
): Promise<CategoryRecord[]> {
  const snapshot = await getFirestoreDb().collection(categories).get();
  return snapshot.docs
    .map((document) => documentRecord<CategoryRecord>(document.id, document.data()))
    .filter((category) => includeInactive || category.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function getCategoryRecord(id: string): Promise<CategoryRecord | null> {
  const snapshot = await getFirestoreDb().collection(categories).doc(id).get();
  return snapshot.exists
    ? documentRecord<CategoryRecord>(snapshot.id, snapshot.data()!)
    : null;
}

export async function findCategoryRecordBySlug(
  slug: string,
): Promise<CategoryRecord | null> {
  const snapshot = await getFirestoreDb()
    .collection(categories)
    .where("slug", "==", slug)
    .limit(1)
    .get();
  const document = snapshot.docs[0];
  return document
    ? documentRecord<CategoryRecord>(document.id, document.data())
    : null;
}

export async function listCollectionRecords(
  includeInactive = false,
): Promise<CollectionRecord[]> {
  const snapshot = await getFirestoreDb().collection(collections).get();
  return snapshot.docs
    .map((document) =>
      documentRecord<CollectionRecord>(document.id, document.data()),
    )
    .filter((collection) => includeInactive || collection.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function findCollectionRecordBySlug(
  slug: string,
): Promise<CollectionRecord | null> {
  const snapshot = await getFirestoreDb()
    .collection(collections)
    .where("slug", "==", slug)
    .limit(1)
    .get();
  const document = snapshot.docs[0];
  return document
    ? documentRecord<CollectionRecord>(document.id, document.data())
    : null;
}

function audit(
  transaction: Transaction,
  actor: ProductAuditActor,
  action: string,
  entityType: string,
  entityId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) {
  const reference = getFirestoreDb().collection("adminAuditLogs").doc();
  transaction.create(reference, {
    id: reference.id,
    actorId: typeof actor === "string" ? actor : actor.id,
    ...(typeof actor === "string"
      ? {}
      : { actorName: actor.name, actorEmail: actor.email }),
    action,
    entityType,
    entityId,
    before,
    after,
    createdAt: FieldValue.serverTimestamp(),
  });
}

function makeVariant(productId: string, input: CreateProductInput["variants"][number]) {
  const now = Timestamp.now();
  return {
    ...input,
    id: randomUUID(),
    productId,
    color: input.color ?? null,
    options: input.options ?? null,
    compareAtPrice: input.compareAtPrice ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function assertUniqueSlug(
  documents: QueryDocumentSnapshot[],
  slug: string,
  exceptId?: string,
) {
  if (documents.some((document) => document.id !== exceptId && document.get("slug") === slug)) {
    throw new FirestoreUniqueValueError("A record with this slug already exists.");
  }
}

export async function listAdminProducts(input: {
  page: number;
  pageSize: number;
  q?: string;
}) {
  const [allProducts, categories] = await Promise.all([
    listProductsFromFirestore(true),
    listCategoryRecords(true),
  ]);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const search = input.q?.toLocaleLowerCase();
  const matching = allProducts
    .filter((product) =>
      !search ||
      [product.name, product.slug, ...product.variants.map((variant) => variant.sku)]
        .some((value) => value.toLocaleLowerCase().includes(search)),
    )
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || a.id.localeCompare(b.id));
  const page = matching
    .slice((input.page - 1) * input.pageSize, input.page * input.pageSize)
    .map((product) => ({
      ...product,
      category: { name: categoryById.get(product.categoryId)?.name ?? "" },
      variants: [...product.variants].sort(
        (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
      ),
    }));
  return { products: page, total: matching.length };
}

export async function createProductRecord(
  input: CreateProductInput,
  actorId: ProductAuditActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(products).doc();
  const record = {
    ...input,
    id: reference.id,
    shortDescription: input.shortDescription ?? null,
    stoneType: input.stoneType ?? null,
    specifications: input.specifications ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    occasions: input.occasions,
    imageUrls: input.imageUrls,
    collectionIds: input.collectionIds,
    variants: input.variants.map((variant) => makeVariant(reference.id, variant)),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await db.runTransaction(async (transaction) => {
    const [existingProducts, category, collectionSnapshots] = await Promise.all([
      transaction.get(db.collection(products)),
      transaction.get(db.collection(categories).doc(input.categoryId)),
      Promise.all(input.collectionIds.map((id) => transaction.get(db.collection(collections).doc(id)))),
    ]);
    assertUniqueSlug(existingProducts.docs, input.slug);
    const skus = new Set<string>();
    for (const product of existingProducts.docs) {
      for (const variant of (product.get("variants") ?? []) as Array<Record<string, unknown>>) {
        if (typeof variant.sku === "string") skus.add(variant.sku.toLocaleLowerCase());
      }
    }
    for (const variant of input.variants) {
      const sku = variant.sku.toLocaleLowerCase();
      if (skus.has(sku)) throw new FirestoreUniqueValueError("A variant with this SKU already exists.");
      skus.add(sku);
    }
    if (!category.exists) throw new FirestoreReferencedRecordError("Category not found.");
    if (collectionSnapshots.some((snapshot) => !snapshot.exists)) {
      throw new FirestoreReferencedRecordError("A selected collection does not exist.");
    }

    transaction.create(reference, record);
    audit(transaction, actorId, "CREATE", "PRODUCT", reference.id, null, {
      name: input.name,
      slug: input.slug,
      active: input.active,
      variantCount: record.variants.length,
    });
    for (const [index, collectionId] of input.collectionIds.entries()) {
      const collectionRef = db.collection(collections).doc(collectionId);
      const collection = collectionSnapshots[index]?.data();
      const productIds = Array.isArray(collection?.productIds)
        ? collection.productIds as string[]
        : [];
      transaction.update(collectionRef, {
        productIds: [...productIds.filter((id) => id !== reference.id), reference.id],
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return productRecord(reference.id, record);
}

export async function updateProductRecord(
  id: string,
  fields: Partial<Pick<
    ProductRecord,
    | "name"
    | "slug"
    | "description"
    | "shortDescription"
    | "categoryId"
    | "material"
    | "plating"
    | "stoneType"
    | "occasions"
    | "specifications"
    | "imageUrls"
    | "seoTitle"
    | "seoDescription"
    | "active"
    | "featured"
  >>,
  actorId: ProductAuditActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(products).doc(id);
  return db.runTransaction(async (transaction) => {
    const beforeSnapshot = await transaction.get(reference);
    if (!beforeSnapshot.exists) return null;
    const beforeData = beforeSnapshot.data()!;
    const [allProducts, category] = await Promise.all([
      fields.slug
        ? transaction.get(db.collection(products))
        : Promise.resolve(null),
      fields.categoryId
        ? transaction.get(db.collection(categories).doc(fields.categoryId))
        : Promise.resolve(null),
    ]);
    if (fields.slug && allProducts) assertUniqueSlug(allProducts.docs, fields.slug, id);
    if (category && !category.exists) {
      throw new FirestoreReferencedRecordError("Category not found.");
    }
    const before = productRecord(id, beforeData);
    const updated = {
      ...fields,
      updatedAt: Timestamp.now(),
    };
    transaction.update(reference, updated);
    audit(
      transaction,
      actorId,
      "UPDATE",
      "PRODUCT",
      id,
      {
        name: before.name,
        slug: before.slug,
        description: before.description,
        shortDescription: before.shortDescription,
        categoryId: before.categoryId,
        material: before.material,
        plating: before.plating,
        stoneType: before.stoneType,
        occasions: before.occasions,
        imageUrls: before.imageUrls,
        active: before.active,
        featured: before.featured,
      },
      fields,
    );
    return productRecord(id, { ...beforeData, ...updated });
  });
}

export async function archiveProductRecord(id: string, actorId: ProductAuditActor) {
  const db = getFirestoreDb();
  const reference = db.collection(products).doc(id);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return null;
    const before = snapshot.data()!;
    transaction.update(reference, {
      active: false,
      updatedAt: Timestamp.now(),
    });
    audit(transaction, actorId, "ARCHIVE", "PRODUCT", id, {
      id,
      name: before.name,
      slug: before.slug,
      active: before.active,
    }, { active: false });
    return productRecord(id, { ...before, active: false });
  });
}

export async function createCategoryRecord(
  input: CreateCategoryInput,
  actorId: ProductAuditActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(categories).doc();
  const record = {
    ...input,
    id: reference.id,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    parentId: input.parentId ?? null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await db.runTransaction(async (transaction) => {
    const [existing, parent] = await Promise.all([
      transaction.get(db.collection(categories)),
      input.parentId
        ? transaction.get(db.collection(categories).doc(input.parentId))
        : Promise.resolve(null),
    ]);
    assertUniqueSlug(existing.docs, input.slug);
    if (parent && !parent.exists) {
      throw new FirestoreReferencedRecordError("Parent category not found.");
    }
    transaction.create(reference, record);
    audit(transaction, actorId, "CREATE", "CATEGORY", reference.id, null, {
      name: input.name,
      slug: input.slug,
      active: input.active,
    });
  });
  return documentRecord<CategoryRecord>(reference.id, record);
}

export async function updateCategoryRecord(
  id: string,
  fields: Partial<CreateCategoryInput>,
  actorId: ProductAuditActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(categories).doc(id);
  return db.runTransaction(async (transaction) => {
    const beforeSnapshot = await transaction.get(reference);
    if (!beforeSnapshot.exists) return null;
    const before = documentRecord<CategoryRecord>(id, beforeSnapshot.data()!);
    const existing = fields.slug
      ? await transaction.get(db.collection(categories))
      : null;
    if (existing && fields.slug) assertUniqueSlug(existing.docs, fields.slug, id);
    if (fields.parentId) {
      const parent = await transaction.get(db.collection(categories).doc(fields.parentId));
      if (!parent.exists) throw new FirestoreReferencedRecordError("Parent category not found.");
    }
    transaction.update(reference, { ...fields, updatedAt: Timestamp.now() });
    audit(transaction, actorId, "UPDATE", "CATEGORY", id, {
      name: before.name,
      slug: before.slug,
      active: before.active,
      sortOrder: before.sortOrder,
    }, fields);
    return documentRecord<CategoryRecord>(id, {
      ...beforeSnapshot.data()!,
      ...fields,
      updatedAt: Timestamp.now(),
    });
  });
}

export async function archiveCategoryRecord(id: string, actorId: ProductAuditActor) {
  const db = getFirestoreDb();
  const reference = db.collection(categories).doc(id);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return null;
    const before = snapshot.data()!;
    transaction.update(reference, { active: false, updatedAt: Timestamp.now() });
    audit(transaction, actorId, "ARCHIVE", "CATEGORY", id, {
      id,
      name: before.name,
      slug: before.slug,
      active: before.active,
    }, { active: false });
    return documentRecord<CategoryRecord>(id, {
      ...before,
      active: false,
      updatedAt: Timestamp.now(),
    });
  });
}

export async function createCollectionRecord(
  input: CreateCollectionInput,
  actorId: ProductAuditActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(collections).doc();
  const record = {
    id: reference.id,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    active: input.active,
    sortOrder: input.sortOrder,
    productIds: input.productIds,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await db.runTransaction(async (transaction) => {
    const [existing, selectedProducts] = await Promise.all([
      transaction.get(db.collection(collections)),
      Promise.all(input.productIds.map((id) => transaction.get(db.collection(products).doc(id)))),
    ]);
    assertUniqueSlug(existing.docs, input.slug);
    if (selectedProducts.some((snapshot) => !snapshot.exists)) {
      throw new FirestoreReferencedRecordError("A selected product does not exist.");
    }
    transaction.create(reference, record);
    audit(transaction, actorId, "CREATE", "COLLECTION", reference.id, null, {
      name: input.name,
      slug: input.slug,
      active: input.active,
    });
    for (const snapshot of selectedProducts) {
      const data = snapshot.data()!;
      const collectionIds = Array.isArray(data.collectionIds)
        ? data.collectionIds as string[]
        : [];
      transaction.update(snapshot.ref, {
        collectionIds: [...collectionIds.filter((id) => id !== reference.id), reference.id],
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
  return documentRecord<CollectionRecord>(reference.id, record);
}

export async function getVariantForProduct(
  productId: string,
  variantId: string,
) {
  const product = await getProductRecord(productId);
  if (!product || !product.active) return null;
  return product.variants.find((variant) => variant.id === variantId && variant.active) ?? null;
}

export async function createProductVariantRecord(
  productId: string,
  input: Omit<ProductVariantRecord, "id" | "productId" | "createdAt" | "updatedAt">,
  actor: ProductAuditActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(products).doc(productId);
  const variantId = randomUUID();
  const now = Timestamp.now();
  const variant: ProductVariantRecord = {
    ...input,
    id: variantId,
    productId,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
  return db.runTransaction(async (transaction) => {
    const [product, allProducts] = await Promise.all([
      transaction.get(reference),
      transaction.get(db.collection(products)),
    ]);
    if (!product.exists) return null;
    const sku = input.sku.toLocaleLowerCase();
    const exists = allProducts.docs.some((document) =>
      ((document.get("variants") ?? []) as Array<Record<string, unknown>>)
        .some((item) => typeof item.sku === "string" && item.sku.toLocaleLowerCase() === sku),
    );
    if (exists) throw new FirestoreUniqueValueError("A variant with this SKU already exists.");
    const before = product.data()!;
    const variants = (before.variants ?? []) as ProductVariantRecord[];
    transaction.update(reference, {
      variants: [...variants, { ...variant, createdAt: now, updatedAt: now }],
      updatedAt: now,
    });
    audit(transaction, actor, "CREATE", "PRODUCT_VARIANT", variantId, null, {
      productId,
      sku: variant.sku,
      inventoryQuantity: variant.inventoryQuantity,
      price: variant.price.toFixed(2),
    });
    return variant;
  });
}

export async function updateProductVariantRecord(
  productId: string,
  variantId: string,
  fields: Partial<Omit<ProductVariantRecord, "id" | "productId" | "createdAt" | "updatedAt">>,
  actor: ProductAuditActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(products).doc(productId);
  return db.runTransaction(async (transaction) => {
    const [product, allProducts] = await Promise.all([
      transaction.get(reference),
      fields.sku ? transaction.get(db.collection(products)) : Promise.resolve(null),
    ]);
    if (!product.exists) return null;
    const data = product.data()!;
    const variants = (data.variants ?? []) as ProductVariantRecord[];
    const before = variants.find((variant) => variant.id === variantId);
    if (!before) return null;
    if (fields.sku && allProducts) {
      const sku = fields.sku.toLocaleLowerCase();
      const duplicate = allProducts.docs.some((document) =>
        ((document.get("variants") ?? []) as Array<Record<string, unknown>>)
          .some((item) =>
            item.id !== variantId &&
            typeof item.sku === "string" &&
            item.sku.toLocaleLowerCase() === sku,
          ),
      );
      if (duplicate) throw new FirestoreUniqueValueError("A variant with this SKU already exists.");
    }
    const now = Timestamp.now();
    const updatedVariant = { ...before, ...fields, updatedAt: now.toDate() };
    transaction.update(reference, {
      variants: variants.map((variant) =>
        variant.id === variantId
          ? { ...updatedVariant, updatedAt: now }
          : variant,
      ),
      updatedAt: now,
    });
    audit(transaction, actor, "UPDATE", "PRODUCT_VARIANT", variantId, {
      sku: before.sku,
      name: before.name,
      price: before.price.toFixed(2),
      inventoryQuantity: before.inventoryQuantity,
      active: before.active,
    }, {
      ...fields,
      ...(fields.price === undefined ? {} : { price: fields.price.toFixed(2) }),
    });
    return updatedVariant;
  });
}

export async function archiveProductVariantRecord(
  productId: string,
  variantId: string,
  actor: ProductAuditActor,
) {
  const db = getFirestoreDb();
  const reference = db.collection(products).doc(productId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return null;
    const data = snapshot.data()!;
    const variants = (data.variants ?? []) as ProductVariantRecord[];
    const before = variants.find((variant) => variant.id === variantId);
    if (!before) return null;
    const now = Timestamp.now();
    transaction.update(reference, {
      variants: variants.map((variant) =>
        variant.id === variantId
          ? { ...variant, active: false, updatedAt: now }
          : variant,
      ),
      updatedAt: now,
    });
    audit(transaction, actor, "ARCHIVE", "PRODUCT_VARIANT", variantId, {
      id: before.id,
      sku: before.sku,
      active: before.active,
    }, { active: false });
    return { ...before, active: false, updatedAt: now.toDate() };
  });
}
