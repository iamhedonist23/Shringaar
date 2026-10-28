import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { createHash, randomUUID } from "node:crypto";
import { calculateOrderTotals, paiseToRupees, rupeesToPaise } from "@/lib/commerce-pricing";
import { isCashOnDeliveryEnabled, isUroPayEnabled } from "@/lib/commerce-config";
import type { CartLineInput, CheckoutInput } from "@/lib/cart-schemas";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { firestoreDate } from "@/lib/firestore/records";
import type {
  CustomerAddressRecord,
  OrderRecord,
  ProductRecord,
  ProductVariantRecord,
} from "@/lib/firestore/types";

const productsCollection = "products";
const ordersCollection = "orders";

function lineKey(productId: string, variantId: string) {
  return `${productId}\u0000${variantId}`;
}

function productFromSnapshot(
  id: string,
  data: FirebaseFirestore.DocumentData,
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
    variants: (data.variants ?? []).map((variant: FirebaseFirestore.DocumentData) => ({
      ...variant,
      productId: id,
      color: variant.color ?? null,
      options: variant.options ?? null,
      compareAtPrice: variant.compareAtPrice ?? null,
      createdAt: firestoreDate(variant.createdAt),
      updatedAt: firestoreDate(variant.updatedAt),
    })),
    createdAt: firestoreDate(data.createdAt),
    updatedAt: firestoreDate(data.updatedAt),
  } as ProductRecord;
}

function orderFromSnapshot(
  id: string,
  data: FirebaseFirestore.DocumentData,
): OrderRecord {
  return {
    ...data,
    id,
    items: data.items ?? [],
    payments: (data.payments ?? []).map((payment: FirebaseFirestore.DocumentData) => ({
      ...payment,
      createdAt: firestoreDate(payment.createdAt),
      updatedAt: firestoreDate(payment.updatedAt),
    })),
    createdAt: firestoreDate(data.createdAt),
    updatedAt: firestoreDate(data.updatedAt),
  } as OrderRecord;
}

function paymentTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getUroPayStatusToken(input: CheckoutInput) {
  if (input.paymentMethod !== "UROPAY" || !input.paymentStatusToken) {
    throw new CheckoutConflictError("A valid UroPay payment status token is required.");
  }
  return input.paymentStatusToken;
}

function requestHash(input: CheckoutInput, customerId?: string) {
  return createHash("sha256")
    .update(JSON.stringify({ input, customerId: customerId ?? null }))
    .digest("hex");
}

function checkoutResponse(order: OrderRecord) {
  const payment = order.payments.find((item) => item.method === "UROPAY");
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    total: order.total.toFixed(2),
    ...(payment?.gatewayCheckoutUrl
      ? { checkoutUrl: payment.gatewayCheckoutUrl }
      : {}),
  };
}

export async function createCartQuote(lines: CartLineInput[]) {
  const db = getFirestoreDb();
  const productIds = [...new Set(lines.map((line) => line.productId))];
  const snapshots = await Promise.all(
    productIds.map((id) => db.collection(productsCollection).doc(id).get()),
  );
  const products = new Map(
    snapshots.flatMap((snapshot) =>
      snapshot.exists
        ? [[snapshot.id, productFromSnapshot(snapshot.id, snapshot.data()!)] as const]
        : [],
    ),
  );
  const variantsByKey = new Map<string, { product: ProductRecord; variant: ProductVariantRecord }>();
  for (const product of products.values()) {
    if (!product.active) continue;
    for (const variant of product.variants) {
      if (variant.active) variantsByKey.set(lineKey(product.id, variant.id), { product, variant });
    }
  }

  const quoteLines = lines.map((line) => {
    const matched = variantsByKey.get(lineKey(line.productId, line.variantId));
    if (!matched) {
      return {
        ...line,
        status: "unavailable" as const,
        productName: null,
        productSlug: null,
        imageUrl: null,
        variantName: null,
        sku: null,
        inventoryQuantity: null,
        unitPrice: null,
        lineTotal: null,
      };
    }

    const { product, variant } = matched;
    const unitPrice = rupeesToPaise(variant.price);
    return {
      ...line,
      status: variant.inventoryQuantity >= line.quantity
        ? ("available" as const)
        : ("out-of-stock" as const),
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.imageUrls[0] ?? null,
      variantName: variant.name,
      sku: variant.sku,
      inventoryQuantity: variant.inventoryQuantity,
      unitPrice: paiseToRupees(unitPrice),
      lineTotal: paiseToRupees(unitPrice * line.quantity),
    };
  });
  const knownItems = quoteLines.flatMap((line) =>
    line.unitPrice === null
      ? []
      : [{ unitPrice: Number(line.unitPrice), quantity: line.quantity }],
  );
  const totals = calculateOrderTotals(knownItems);

  return {
    lines: quoteLines,
    subtotal: paiseToRupees(totals.subtotalPaise),
    shipping: paiseToRupees(totals.shippingPaise),
    tax: "0.00" as const,
    discount: "0.00" as const,
    total: paiseToRupees(totals.totalPaise),
    canCheckout:
      quoteLines.length > 0 &&
      quoteLines.every((line) => line.status === "available"),
  };
}

export class CheckoutConflictError extends Error {}
export class PaymentMethodUnavailableError extends Error {}

export async function createOrder(
  input: CheckoutInput,
  idempotencyKey: string,
  customerId?: string,
) {
  if (input.paymentMethod === "COD" && !isCashOnDeliveryEnabled()) {
    throw new PaymentMethodUnavailableError(
      "Cash on delivery is currently unavailable. Please try again later.",
    );
  }
  if (input.paymentMethod === "UROPAY" && !isUroPayEnabled()) {
    throw new PaymentMethodUnavailableError(
      "UroPay test payments are not configured. Choose cash on delivery or try again later.",
    );
  }

  const db = getFirestoreDb();
  const fingerprint = requestHash(input, customerId);
  const idempotencyReference = db
    .collection("orderIdempotencyKeys")
    .doc(idempotencyKey);

  return db.runTransaction(async (transaction) => {
    const idempotencySnapshot = await transaction.get(idempotencyReference);
    const existingOrderId = idempotencySnapshot.exists
      ? idempotencySnapshot.get("orderId")
      : idempotencyKey;
    if (typeof existingOrderId !== "string") {
      throw new Error("Checkout idempotency mapping is malformed.");
    }
    const orderReference = db.collection(ordersCollection).doc(existingOrderId);
    const existingSnapshot = await transaction.get(orderReference);
    if (existingSnapshot.exists) {
      const existing = orderFromSnapshot(existingOrderId, existingSnapshot.data()!);
      if (existing.idempotencyKey !== idempotencyKey) {
        throw new CheckoutConflictError(
          "This checkout request key is already associated with another order.",
        );
      }
      if (existing.requestHash !== fingerprint) {
        throw new CheckoutConflictError(
          "This checkout request key was already used for different order details. Refresh checkout and try again.",
        );
      }
      if (
        input.paymentMethod === "UROPAY" &&
        existing.payments[0]?.statusTokenHash !==
          paymentTokenHash(getUroPayStatusToken(input))
      ) {
        throw new CheckoutConflictError(
          "This payment session is no longer valid. Refresh checkout and try again.",
        );
      }
      if (!idempotencySnapshot.exists) {
        transaction.create(idempotencyReference, { orderId: existingOrderId });
      }
      return checkoutResponse(existing);
    }
    if (idempotencySnapshot.exists) {
      throw new Error("Checkout idempotency mapping points to a missing order.");
    }

    const customerReference = customerId
      ? db.collection("customers").doc(customerId)
      : null;
    const addressReference = customerId && input.addressId
      ? customerReference!.collection("addresses").doc(input.addressId)
      : null;
    const customerSnapshot = customerReference
      ? await transaction.get(customerReference)
      : null;
    const addressSnapshot = addressReference
      ? await transaction.get(addressReference)
      : null;
    const productIds = [...new Set(input.lines.map((line) => line.productId))];
    const productSnapshots = await Promise.all(
      productIds.map((id) => transaction.get(db.collection(productsCollection).doc(id))),
    );

    const customer = customerSnapshot?.exists ? customerSnapshot.data()! : null;
    if (customerId && !customer) {
      throw new CheckoutConflictError("Your account details could not be verified. Please sign in again.");
    }
    if ((input.addressId || input.saveAddress) && !customerId) {
      throw new CheckoutConflictError("Sign in to use or save an address.");
    }

    const products = new Map(
      productSnapshots.flatMap((snapshot) =>
        snapshot.exists
          ? [[snapshot.id, productFromSnapshot(snapshot.id, snapshot.data()!)] as const]
          : [],
      ),
    );
    const savedAddress = addressSnapshot?.exists
      ? ({
          ...addressSnapshot.data()!,
          id: addressSnapshot.id,
          customerId: customerId!,
        } as CustomerAddressRecord)
      : null;
    if (input.addressId && !savedAddress) {
      throw new CheckoutConflictError("That saved address is unavailable. Choose another address.");
    }
    const savedAddresses = customer && input.saveAddress && !savedAddress
      ? await transaction.get(customerReference!.collection("addresses"))
      : null;

    const address = savedAddress
      ? {
          line1: savedAddress.addressLine1,
          line2: savedAddress.addressLine2 ?? undefined,
          locality: savedAddress.locality,
          city: savedAddress.city,
          state: savedAddress.state,
          postalCode: savedAddress.postalCode,
          country: "India" as const,
        }
      : input.address;
    const customerDetails = customer
      ? {
          name: savedAddress?.fullName ?? input.customer.name,
          email: customer.email as string,
          phone: savedAddress?.phone ?? input.customer.phone,
        }
      : input.customer;

    const orderLines = input.lines.map((line) => {
      const product = products.get(line.productId);
      const variant = product?.variants.find((item) => item.id === line.variantId);
      if (!product?.active || !variant?.active) {
        throw new CheckoutConflictError(
          "A product in your bag is no longer available. Please review your bag.",
        );
      }
      return { line, product, variant };
    });

    const reservedQuantities = new Map<string, number>();
    for (const { line } of orderLines) {
      const key = lineKey(line.productId, line.variantId);
      reservedQuantities.set(key, (reservedQuantities.get(key) ?? 0) + line.quantity);
    }
    for (const [key, quantity] of reservedQuantities) {
      const [productId, variantId] = key.split("\u0000");
      const variant = products.get(productId)?.variants.find((item) => item.id === variantId);
      if (!variant || variant.inventoryQuantity < quantity) {
        throw new CheckoutConflictError(
          "Stock changed while placing your order. Please review your bag and try again.",
        );
      }
    }

    const totals = calculateOrderTotals(
      orderLines.map(({ line, variant }) => ({
        unitPrice: variant.price,
        quantity: line.quantity,
      })),
    );
    const now = Timestamp.now();
    const orderNumber = `SHR-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const paymentStatusHash = input.paymentMethod === "UROPAY"
      ? paymentTokenHash(getUroPayStatusToken(input))
      : null;
    const paymentId = randomUUID();
    const orderId = idempotencyKey;
    const order: OrderRecord = {
      id: orderId,
      orderNumber,
      idempotencyKey,
      requestHash: fingerprint,
      inventoryReserved: true,
      status: input.paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
      shipmentStatus: "PENDING",
      trackingNumber: null,
      carrierName: null,
      paymentStatus: "PENDING",
      paymentMethod: input.paymentMethod,
      customerName: customerDetails.name,
      customerEmail: customerDetails.email,
      customerPhone: customerDetails.phone,
      customerId: customerId ?? null,
      addressLine1: address.line1,
      addressLine2: address.line2 || null,
      locality: address.locality || null,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      subtotal: Number(paiseToRupees(totals.subtotalPaise)),
      shippingAmount: Number(paiseToRupees(totals.shippingPaise)),
      taxAmount: Number(paiseToRupees(totals.taxPaise)),
      discountAmount: Number(paiseToRupees(totals.discountPaise)),
      total: Number(paiseToRupees(totals.totalPaise)),
      items: orderLines.map(({ line, product, variant }) => ({
        id: randomUUID(),
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        imageUrl: product.imageUrls[0] ?? null,
        unitPrice: variant.price,
        quantity: line.quantity,
        lineTotal: Number(
          paiseToRupees(rupeesToPaise(variant.price) * line.quantity),
        ),
        createdAt: now.toDate(),
      })),
      payments: [{
        id: paymentId,
        method: input.paymentMethod,
        status: "PENDING",
        amount: Number(paiseToRupees(totals.totalPaise)),
        currency: "INR",
        gatewayOrderId: null,
        gatewayPaymentId: null,
        gatewayCheckoutUrl: null,
        statusTokenHash: paymentStatusHash,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      }],
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };

    for (const [key, quantity] of reservedQuantities) {
      const [productId, variantId] = key.split("\u0000");
      const product = products.get(productId)!;
      const reference = db.collection(productsCollection).doc(productId);
      const variants = product.variants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              inventoryQuantity: variant.inventoryQuantity - quantity,
              updatedAt: now,
            }
          : variant,
      );
      transaction.update(reference, {
        variants,
        updatedAt: now,
      });
    }

    if (customer && input.saveAddress && !savedAddress) {
      if (!address.locality) {
        throw new CheckoutConflictError("Enter a locality to save this address.");
      }
      const customerAddressCollection = customerReference!.collection("addresses");
      const isDefault = savedAddresses?.empty ?? true;
      const addressId = randomUUID();
      transaction.create(customerAddressCollection.doc(addressId), {
        id: addressId,
        customerId,
        fullName: input.customer.name,
        phone: input.customer.phone,
        addressLine1: address.line1,
        addressLine2: address.line2 || null,
        locality: address.locality,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        addressType: input.addressType ?? "HOME",
        isDefault,
        createdAt: now,
        updatedAt: now,
      });
      if (!customer.phone) {
        transaction.update(customerReference!, {
          phone: input.customer.phone,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    transaction.create(orderReference, order);
    transaction.create(idempotencyReference, { orderId });
    if (paymentStatusHash) {
      transaction.create(
        db.collection("paymentStatusTokens").doc(paymentStatusHash),
        { orderId, paymentId },
      );
    }
    return checkoutResponse(order);
  });
}

export const createGuestOrder = createOrder;
