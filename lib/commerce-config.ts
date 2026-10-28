export function isCashOnDeliveryEnabled() {
  return process.env.COD_ENABLED?.trim().toLowerCase() !== "false";
}

export function isUroPayEnabled() {
  const authUrl = process.env.AUTH_URL?.trim();
  const key = process.env.UROPAY_TEST_API_KEY?.trim();
  const secret = process.env.UROPAY_TEST_API_SECRET?.trim();
  if (!key?.startsWith("TEST_") || !secret || !authUrl) return false;
  try {
    const appUrl = new URL(authUrl);
    if (appUrl.protocol !== "https:") return false;
    const callback = getUroPayReturnUrl(appUrl.origin);
    return callback.origin === appUrl.origin;
  } catch {
    return false;
  }
}

export function getUroPayReturnUrl(origin: string) {
  const configured = process.env.UROPAY_RETURN_URL?.trim();
  const returnUrl = configured
    ? new URL(configured)
    : new URL("/checkout/payment-result", origin);
  if (
    returnUrl.protocol !== "https:" ||
    returnUrl.origin !== origin ||
    returnUrl.pathname !== "/checkout/payment-result" ||
    returnUrl.search ||
    returnUrl.username ||
    returnUrl.password ||
    returnUrl.hash
  ) {
    throw new Error("UROPAY_RETURN_URL must be an HTTPS URL on AUTH_URL with the /checkout/payment-result path.");
  }
  return returnUrl;
}
