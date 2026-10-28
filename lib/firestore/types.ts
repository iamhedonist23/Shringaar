import type { Timestamp } from "firebase-admin/firestore";

export type FirestoreDate = Date | Timestamp;

export type ProductVariantRecord = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  color: string | null;
  options: Record<string, string> | null;
  price: number;
  compareAtPrice: number | null;
  inventoryQuantity: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  categoryId: string;
  material: string;
  plating: string;
  stoneType: string | null;
  occasions: string[];
  specifications: Record<string, string> | null;
  imageUrls: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  active: boolean;
  featured: boolean;
  variants: ProductVariantRecord[];
  collectionIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  active: boolean;
  sortOrder: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CollectionRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  active: boolean;
  sortOrder: number;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerRecord = {
  uid: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerAddressRecord = {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  addressType: "HOME" | "WORK";
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type ShipmentStatus =
  | "PENDING"
  | "PACKING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "EXCEPTION"
  | "RETURNED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type PaymentMethod = "COD" | "PAYTM" | "UROPAY" | "UNSPECIFIED";

export type OrderItemRecord = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: Date;
};

export type PaymentRecord = {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  gatewayCheckoutUrl: string | null;
  statusTokenHash: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  idempotencyKey: string;
  requestHash: string;
  inventoryReserved: boolean;
  status: OrderStatus;
  shipmentStatus: ShipmentStatus;
  trackingNumber: string | null;
  carrierName: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId: string | null;
  addressLine1: string;
  addressLine2: string | null;
  locality: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  items: OrderItemRecord[];
  payments: PaymentRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type AdminAuditRecord = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: Date;
};
