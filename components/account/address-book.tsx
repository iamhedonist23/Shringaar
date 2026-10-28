"use client";

import { useState, type FormEvent } from "react";

export type CustomerAddressDto = {
  id: string;
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
};

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  locality: "",
  city: "",
  state: "",
  postalCode: "",
  addressType: "HOME",
};

export function AddressBook({ initialAddresses }: { initialAddresses: CustomerAddressDto[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<CustomerAddressDto | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh() {
    const response = await fetch("/api/account/addresses", { cache: "no-store" });
    if (!response.ok) throw new Error("Saved addresses could not be refreshed.");
    const result = (await response.json()) as { addresses: CustomerAddressDto[] };
    setAddresses(result.addresses);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const formData = new FormData(event.currentTarget);
    const body = {
      ...Object.fromEntries(formData.entries()),
      isDefault: formData.get("isDefault") === "true",
    };
    setPending(true);
    try {
      const response = await fetch(
        editing ? `/api/account/addresses/${encodeURIComponent(editing.id)}` : "/api/account/addresses",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Address could not be saved.");
      await refresh();
      setEditing(null);
      setNotice("Address saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Address could not be saved.");
    } finally {
      setPending(false);
    }
  }

  async function setDefault(address: CustomerAddressDto) {
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const response = await fetch(`/api/account/addresses/${encodeURIComponent(address.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Default address could not be changed.");
      await refresh();
      setNotice("Default address updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Default address could not be changed.");
    } finally {
      setPending(false);
    }
  }

  async function remove(address: CustomerAddressDto) {
    if (!window.confirm(`Delete the ${address.addressType.toLowerCase()} address?`)) return;
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const response = await fetch(`/api/account/addresses/${encodeURIComponent(address.id)}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Address could not be deleted.");
      await refresh();
      setNotice("Address deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Address could not be deleted.");
    } finally {
      setPending(false);
    }
  }

  const current = editing ?? emptyAddress;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
      <section aria-label="Saved delivery addresses" className="space-y-4">
        {notice && <p className="rounded-control bg-success/10 px-4 py-3 text-sm text-success" role="status">{notice}</p>}
        {error && <p className="rounded-control bg-error/10 px-4 py-3 text-sm text-error" role="alert">{error}</p>}
        {addresses.length === 0 && <p className="rounded-card border border-border bg-white p-5 text-sm text-muted">No saved addresses yet. Add one to make checkout quicker.</p>}
        {addresses.map((address) => (
          <article className="rounded-card border border-border bg-white p-5 shadow-card" key={address.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-plum">{address.addressType === "HOME" ? "Home" : "Work"}</h2>
                {address.isDefault && <span className="rounded-full bg-ivory px-2.5 py-1 text-xs font-medium text-plum">Default</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="min-h-10 rounded-control border border-border px-3 text-xs font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" disabled={pending} onClick={() => setEditing(address)} type="button">Edit</button>
                {!address.isDefault && <button className="min-h-10 rounded-control border border-border px-3 text-xs font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" disabled={pending} onClick={() => void setDefault(address)} type="button">Set default</button>}
                <button className="min-h-10 rounded-control border border-error/30 px-3 text-xs font-semibold text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error" disabled={pending} onClick={() => void remove(address)} type="button">Delete</button>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-plum">{address.fullName} · {address.phone}</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {[address.addressLine1, address.addressLine2, address.locality, address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
            </p>
          </article>
        ))}
      </section>

      <section className="h-fit rounded-card border border-border bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-2xl text-plum">{editing ? "Edit address" : "Add an address"}</h2>
        <form className="mt-5 grid gap-4" key={editing?.id ?? "new-address"} onSubmit={save}>
          {[
            ["fullName", "Full name", "name"],
            ["phone", "Indian mobile number", "tel"],
            ["addressLine1", "Address", "address-line1"],
            ["addressLine2", "Apartment, suite, landmark (optional)", "address-line2"],
            ["locality", "Locality / area", "address-level3"],
            ["city", "City", "address-level2"],
            ["state", "State", "address-level1"],
            ["postalCode", "PIN code", "postal-code"],
          ].map(([name, label, autocomplete]) => (
            <label className="block text-sm font-medium text-plum" htmlFor={`address-${name}`} key={name}>
              {label}
              <input autoComplete={autocomplete} className="mt-2 min-h-11 w-full rounded-control border border-border px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" defaultValue={name === "addressLine2" ? current.addressLine2 ?? "" : current[name as keyof typeof current] as string} id={`address-${name}`} inputMode={name === "postalCode" || name === "phone" ? "numeric" : undefined} maxLength={name === "addressLine1" || name === "addressLine2" ? 200 : name === "phone" ? 15 : name === "postalCode" ? 6 : 120} name={name} required={name !== "addressLine2"} />
            </label>
          ))}
          <label className="block text-sm font-medium text-plum" htmlFor="address-type">
            Address type
            <select className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3" defaultValue={current.addressType} id="address-type" name="addressType">
              <option value="HOME">Home</option>
              <option value="WORK">Work</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-plum">
            <input defaultChecked={editing?.isDefault ?? addresses.length === 0} name="isDefault" type="checkbox" value="true" />
            Make this my default address
          </label>
          <div className="flex flex-wrap gap-3">
            <button className="min-h-11 rounded-control bg-plum px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving…" : editing ? "Save changes" : "Save address"}</button>
            {editing && <button className="min-h-11 rounded-control border border-border px-4 text-sm font-semibold text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" onClick={() => setEditing(null)} type="button">Cancel</button>}
          </div>
        </form>
      </section>
    </div>
  );
}
