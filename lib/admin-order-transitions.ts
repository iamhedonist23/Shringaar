export const ADMIN_ORDER_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["CANCELLED"],
  SHIPPED: [],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
} as const;

export function canAdminTransitionOrder(from: string, to: string) {
  return (
    from in ADMIN_ORDER_TRANSITIONS &&
    ADMIN_ORDER_TRANSITIONS[from as keyof typeof ADMIN_ORDER_TRANSITIONS].some(
      (status) => status === to,
    )
  );
}
