"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  isShipmentStatus,
  SHIPMENT_STATUS_TRANSITIONS,
  type ShipmentStatus,
} from "@/lib/admin-shipment";

type FulfillmentData = {
  shipmentStatus: ShipmentStatus;
  trackingNumber: string | null;
  carrierName: string | null;
  customerName: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function OrderFulfillmentControl({
  orderId,
  fulfillment,
}: {
  orderId: string;
  fulfillment: FulfillmentData;
}) {
  const router = useRouter();
  const [data, setData] = useState(fulfillment);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Refresh editable fields when the server sends a newer order snapshot.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setData(fulfillment), [fulfillment]);

  function setField<Key extends keyof FulfillmentData>(
    key: Key,
    value: FulfillmentData[Key],
  ) {
    setData((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/fulfillment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            trackingNumber: data.trackingNumber?.trim() || null,
            carrierName: data.carrierName?.trim() || null,
            addressLine2: data.addressLine2?.trim() || null,
          }),
        },
      );
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        setError(
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : "Fulfilment details could not be saved.",
        );
        return;
      }
      setNotice("Fulfilment details saved.");
      router.refresh();
    } catch {
      setError("Could not connect to the admin service.");
    } finally {
      setSaving(false);
    }
  }

  const statusOptions = [
    data.shipmentStatus,
    ...SHIPMENT_STATUS_TRANSITIONS[data.shipmentStatus],
  ];

  return (
    <form className="space-y-4" onSubmit={submit}>
      <label className="block space-y-1 text-sm font-medium text-plum">
        Shipment status
        <select
          className="h-11 w-full rounded-control border border-border bg-white px-3"
          disabled={saving}
          onChange={(event) => {
            if (isShipmentStatus(event.target.value)) {
              setField("shipmentStatus", event.target.value);
            }
          }}
          value={data.shipmentStatus}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-plum">
          Carrier (manual)
          <input className="h-11 w-full rounded-control border border-border px-3" maxLength={120} onChange={(event) => setField("carrierName", event.target.value)} value={data.carrierName ?? ""} />
        </label>
        <label className="space-y-1 text-sm text-plum">
          Tracking number
          <input className="h-11 w-full rounded-control border border-border px-3" maxLength={120} onChange={(event) => setField("trackingNumber", event.target.value)} value={data.trackingNumber ?? ""} />
        </label>
      </div>
      <fieldset className="space-y-3 rounded-control border border-border p-3">
        <legend className="px-1 text-sm font-semibold text-plum">Delivery address</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-plum">Recipient name<input className="h-11 w-full rounded-control border border-border px-3" maxLength={120} minLength={2} onChange={(event) => setField("customerName", event.target.value)} required value={data.customerName} /></label>
          <label className="space-y-1 text-sm text-plum">Contact phone<input className="h-11 w-full rounded-control border border-border px-3" maxLength={30} minLength={7} onChange={(event) => setField("customerPhone", event.target.value)} required value={data.customerPhone} /></label>
          <label className="space-y-1 text-sm text-plum sm:col-span-2">Address line 1<input className="h-11 w-full rounded-control border border-border px-3" maxLength={180} minLength={3} onChange={(event) => setField("addressLine1", event.target.value)} required value={data.addressLine1} /></label>
          <label className="space-y-1 text-sm text-plum sm:col-span-2">Address line 2<input className="h-11 w-full rounded-control border border-border px-3" maxLength={180} onChange={(event) => setField("addressLine2", event.target.value)} value={data.addressLine2 ?? ""} /></label>
          <label className="space-y-1 text-sm text-plum">City<input className="h-11 w-full rounded-control border border-border px-3" maxLength={100} minLength={2} onChange={(event) => setField("city", event.target.value)} required value={data.city} /></label>
          <label className="space-y-1 text-sm text-plum">State<input className="h-11 w-full rounded-control border border-border px-3" maxLength={100} minLength={2} onChange={(event) => setField("state", event.target.value)} required value={data.state} /></label>
          <label className="space-y-1 text-sm text-plum">Postal code<input className="h-11 w-full rounded-control border border-border px-3" maxLength={20} minLength={3} onChange={(event) => setField("postalCode", event.target.value)} required value={data.postalCode} /></label>
          <label className="space-y-1 text-sm text-plum">Country<input className="h-11 w-full rounded-control border border-border px-3" maxLength={100} minLength={2} onChange={(event) => setField("country", event.target.value)} required value={data.country} /></label>
        </div>
      </fieldset>
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      {notice && <p className="text-sm text-success" role="status">{notice}</p>}
      <p className="text-xs leading-5 text-muted">
        Address edits are disabled after dispatch. Carrier and tracking details are entered manually; no courier service is connected.
      </p>
      <button className="min-h-11 w-full rounded-control bg-plum px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save fulfilment"}
      </button>
    </form>
  );
}
