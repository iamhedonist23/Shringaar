export function isAdminRole(role: unknown): role is "ADMIN" {
  return role === "ADMIN";
}

export function isCustomerRole(role: unknown): role is "CUSTOMER" {
  return role === "CUSTOMER";
}
