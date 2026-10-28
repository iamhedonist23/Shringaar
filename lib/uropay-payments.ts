import { createHash } from "node:crypto";
import { getUroPayReturnUrl } from "@/lib/commerce-config";
import {
  applyUroPayProviderStatus,
  getOrderForPaymentStatusToken,
  getOrderRecord,
  updateOrderPayment,
} from "@/lib/repositories/order.repository";
import {
  createUroPayOrder,
  getUroPayOrder,
  UroPayError,
} from "@/lib/uropay-client";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUroPayCheckout(orderId: string, statusToken: string) {
  const order = await getOrderRecord(orderId);
  const payment = order?.payments.find(
    (item) =>
      item.method === "UROPAY" &&
      item.statusTokenHash === tokenHash(statusToken),
  );
  if (!order || !payment) throw new UroPayError("The payment session is not valid.");
  if (payment.gatewayCheckoutUrl) {
    return { checkoutUrl: payment.gatewayCheckoutUrl };
  }

  const authUrl = process.env.AUTH_URL;
  if (!authUrl) throw new UroPayError("UroPay return URL is not configured.");
  const callback = getUroPayReturnUrl(new URL(authUrl).origin);
  callback.searchParams.set("token", statusToken);
  const providerOrder = await createUroPayOrder({
    tenantOrderRef: order.orderNumber,
    amount: payment.amount,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    returnUrl: callback.toString(),
    origin: callback.origin,
  });

  await updateOrderPayment(
    order.id,
    payment.id,
    {
      gatewayOrderId: providerOrder.id,
      gatewayCheckoutUrl: providerOrder.openUrl ?? null,
    },
    {},
  );
  return { checkoutUrl: providerOrder.openUrl };
}

export class PaymentStatusNotReadyError extends Error {}
export class PaymentStatusTokenInvalidError extends Error {}

export async function refreshUroPayPayment(statusToken: string) {
  const payment = await getOrderForPaymentStatusToken(tokenHash(statusToken));
  if (!payment || payment.payment.method !== "UROPAY") {
    throw new PaymentStatusTokenInvalidError();
  }
  return refreshUroPayPaymentRecord(payment.order, payment.payment);
}

export async function refreshUroPayPaymentForOrder(orderId: string) {
  const order = await getOrderRecord(orderId);
  const payment = order?.payments.find((item) => item.method === "UROPAY");
  if (!order || !payment) throw new PaymentStatusTokenInvalidError();
  return refreshUroPayPaymentRecord(order, payment);
}

async function refreshUroPayPaymentRecord(
  order: NonNullable<Awaited<ReturnType<typeof getOrderRecord>>>,
  payment: NonNullable<Awaited<ReturnType<typeof getOrderRecord>>>["payments"][number],
) {
  if (!payment.gatewayOrderId) throw new PaymentStatusNotReadyError();
  const providerOrder = await getUroPayOrder(payment.gatewayOrderId);
  if (
    providerOrder.id !== payment.gatewayOrderId ||
    providerOrder.tenantOrderRef !== order.orderNumber ||
    providerOrder.amount !== payment.amount ||
    providerOrder.currency !== payment.currency
  ) {
    throw new UroPayError("UroPay payment details do not match the stored order.");
  }

  const synced = providerOrder.status === "PENDING"
    ? {
        paymentStatus: payment.status,
        orderStatus: order.status,
        inventoryNeedsReview: false,
      }
    : await applyUroPayProviderStatus(order.id, payment.id, providerOrder.status);

  return {
    orderNumber: order.orderNumber,
    amount: payment.amount.toFixed(2),
    providerStatus: providerOrder.status,
    ...synced,
  };
}
