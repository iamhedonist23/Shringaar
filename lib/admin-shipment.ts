export const SHIPMENT_STATUS_TRANSITIONS = {
  PENDING: ["PACKING"],
  PACKING: ["READY_TO_SHIP"],
  READY_TO_SHIP: ["SHIPPED"],
  SHIPPED: ["IN_TRANSIT", "DELIVERED", "EXCEPTION", "RETURNED"],
  IN_TRANSIT: ["DELIVERED", "EXCEPTION", "RETURNED"],
  DELIVERED: ["RETURNED"],
  EXCEPTION: ["IN_TRANSIT", "RETURNED"],
  RETURNED: [],
  CANCELLED: [],
} as const;

export type ShipmentStatus = keyof typeof SHIPMENT_STATUS_TRANSITIONS;

export function isShipmentStatus(value: string): value is ShipmentStatus {
  return Object.prototype.hasOwnProperty.call(
    SHIPMENT_STATUS_TRANSITIONS,
    value,
  );
}

export function canTransitionShipment(from: string, to: string) {
  return (
    from in SHIPMENT_STATUS_TRANSITIONS &&
    SHIPMENT_STATUS_TRANSITIONS[from as ShipmentStatus].some(
      (status) => status === to,
    )
  );
}

export function canEditShippingAddress(status: string) {
  return ["PENDING", "PACKING", "READY_TO_SHIP"].includes(status);
}

export const SHIPMENT_ADDRESS_FIELDS = [
  "customerName",
  "customerPhone",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "country",
] as const;
