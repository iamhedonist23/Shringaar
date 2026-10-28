const FREE_SHIPPING_THRESHOLD_PAISE = 49_900;
const SHIPPING_FEE_PAISE = 9_900;

export function rupeesToPaise(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("A monetary amount must be finite and non-negative.");
  }
  const paise = Math.round(amount * 100);
  if (!Number.isSafeInteger(paise)) {
    throw new RangeError("The monetary amount exceeds the supported range.");
  }
  return paise;
}

export function paiseToRupees(paise: number): string {
  if (!Number.isSafeInteger(paise) || paise < 0) {
    throw new RangeError("An amount in paise must be a non-negative integer.");
  }
  return (paise / 100).toFixed(2);
}

export function calculateShippingPaise(subtotalPaise: number): number {
  if (!Number.isSafeInteger(subtotalPaise) || subtotalPaise < 0) {
    throw new RangeError("A subtotal in paise must be a non-negative integer.");
  }
  return subtotalPaise > FREE_SHIPPING_THRESHOLD_PAISE
    ? 0
    : SHIPPING_FEE_PAISE;
}

export function calculateOrderTotals(
  items: ReadonlyArray<{ unitPrice: number; quantity: number }>,
) {
  const subtotalPaise = items.reduce((sum, item) => {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new RangeError("Item quantity is outside the supported range.");
    }
    return sum + rupeesToPaise(item.unitPrice) * item.quantity;
  }, 0);
  if (!Number.isSafeInteger(subtotalPaise)) {
    throw new RangeError("The order subtotal exceeds the supported range.");
  }
  const shippingPaise =
    items.length === 0 ? 0 : calculateShippingPaise(subtotalPaise);
  return {
    subtotalPaise,
    shippingPaise,
    taxPaise: 0,
    discountPaise: 0,
    totalPaise: subtotalPaise + shippingPaise,
  };
}
