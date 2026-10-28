"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UroPayStatusRefresh({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refreshStatus() {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/payment-status`,
        { method: "POST" },
      );
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        setError(
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : "Payment status could not be refreshed.",
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
      <button
        className="min-h-10 w-full rounded-control border border-border px-3 text-sm font-medium text-plum disabled:opacity-60"
        disabled={saving}
        onClick={() => void refreshStatus()}
        type="button"
      >
        {saving ? "Checking UroPay…" : "Refresh from UroPay"}
      </button>
      {error && <p className="mt-2 text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}
