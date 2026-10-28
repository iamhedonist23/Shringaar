"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const nextStatuses: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["CANCELLED"],
  SHIPPED: [],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};

export function OrderStatusControl({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const options = nextStatuses[status] ?? [];

  async function update(nextStatus: string) {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        setError(
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : "Order status could not be updated.",
        );
        return;
      }
      router.refresh();
    } catch {
      setError("Could not connect to the admin service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-plum" htmlFor="next-order-status">Update order status</label>
      <select
        className="mt-2 h-11 w-full rounded-control border border-border bg-white px-3 text-sm"
        disabled={saving || options.length === 0}
        id="next-order-status"
        onChange={(event) => {
          if (event.target.value) void update(event.target.value);
        }}
        value=""
      >
        <option value="">{options.length ? "Choose next status…" : "No further status changes"}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error && <p className="mt-2 text-sm text-error" role="alert">{error}</p>}
      {status === "CONFIRMED" || status === "PROCESSING" ? (
        <p className="mt-2 text-xs leading-5 text-muted">Cancelling restores the reserved stock. Paid orders require separate refund handling.</p>
      ) : null}
    </div>
  );
}
