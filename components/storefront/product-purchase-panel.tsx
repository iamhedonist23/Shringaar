"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { hydrateCart, useCartStore } from "@/lib/cart-store";
import { variantAvailabilityResponseSchema } from "@/lib/catalog-schemas";

type PurchaseVariant = {
  id: string;
  sku: string;
  name: string;
  color: string | null;
  options: unknown;
  price: number;
  compareAtPrice: number | null;
  inventoryQuantity: number;
};

function optionSize(options: unknown): string | null {
  if (!options || typeof options !== "object" || Array.isArray(options)) return null;
  const entries = Object.entries(options);
  const size = entries.find(([key]) => key.toLowerCase() === "size")?.[1];
  return typeof size === "string" && size.trim() ? size.trim() : null;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProductPurchasePanel({
  product,
  variants,
  hasSizeOptions,
}: {
  product: { id: string; slug: string; name: string };
  variants: PurchaseVariant[];
  hasSizeOptions: boolean;
}) {
  const availableVariants = useMemo(
    () => [...variants].sort((a, b) => a.price - b.price || a.id.localeCompare(b.id)),
    [variants],
  );
  const initialVariant =
    availableVariants.find((variant) => variant.inventoryQuantity > 0) ??
    availableVariants[0];
  const [variantId, setVariantId] = useState(initialVariant?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const selectedVariant =
    availableVariants.find((variant) => variant.id === variantId) ?? initialVariant;
  const addItem = useCartStore((state) => state.addItem);
  const existingQuantity = useCartStore((state) =>
    selectedVariant
      ? state.lines.find(
          (line) =>
            line.productId === product.id && line.variantId === selectedVariant.id,
        )?.quantity ?? 0
      : 0,
  );
  const { toast } = useToast();
  useEffect(() => {
    void hydrateCart();
  }, []);
  const sizeValues = [
    ...new Set(
      availableVariants
        .map((variant) => optionSize(variant.options))
        .filter(Boolean),
    ),
  ];
  const inStock = Boolean(selectedVariant && selectedVariant.inventoryQuantity > 0);

  function selectVariant(id: string) {
    setVariantId(id);
    setQuantity(1);
  }

  async function addToBag() {
    if (!selectedVariant || selectedVariant.inventoryQuantity < 1) {
      toast("This variant is currently out of stock.");
      return;
    }
    setIsAdding(true);
    try {
      const requestedQuantity = existingQuantity + quantity;
      if (requestedQuantity > 99) {
        toast("A maximum of 99 of this option can be added to your bag.");
        return;
      }
      const response = await fetch(
        `/api/products/${encodeURIComponent(product.slug)}/availability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId: selectedVariant.id,
            quantity: requestedQuantity,
          }),
        },
      );
      const responseBody: unknown = await response.json();
      const availability = variantAvailabilityResponseSchema.safeParse(responseBody);
      if (!availability.success) {
        if (response.status === 404) {
          toast("This product option is no longer available.");
          return;
        }
        throw new Error("The availability response was invalid.");
      }
      if (!availability.data.available) {
        toast(
          availability.data.inventoryQuantity === 0
            ? "This variant is currently out of stock."
            : `Only ${Math.max(0, availability.data.inventoryQuantity - existingQuantity)} more available for this finish.`,
        );
        return;
      }
      const result = addItem(
        { productId: product.id, variantId: availability.data.variantId },
        quantity,
      );
      if (result.status === "added") {
        toast(`${product.name} added to your bag.`);
      } else if (result.status === "limit") {
        setQuantity(Math.max(1, result.quantity - existingQuantity));
        toast("A maximum of 99 of this option can be added to your bag.");
      } else if (result.status === "full") {
        toast("Your bag has reached its 50-option limit. Remove an item before adding another.");
      } else {
        toast("This variant is currently unavailable.");
      }
    } catch (error) {
      console.error("Product availability could not be validated:", error);
      toast("We couldn’t confirm stock. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="mt-6">
      {selectedVariant ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-semibold text-plum">
              {inr.format(selectedVariant.price)}
            </span>
            {selectedVariant.compareAtPrice !== null &&
              selectedVariant.compareAtPrice > selectedVariant.price && (
                <span className="text-sm text-muted line-through">
                  {inr.format(selectedVariant.compareAtPrice)}
                </span>
              )}
          </div>
          <p
            className={`mt-2 text-sm font-medium ${inStock ? "text-success" : "text-error"}`}
            role="status"
          >
            {inStock
              ? `${selectedVariant.inventoryQuantity} available`
              : "Out of stock"}
          </p>

          {availableVariants.length > 0 && (
            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-plum">
                Choose finish
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableVariants.map((variant) => {
                  const selected = variant.id === selectedVariant.id;
                  const label = [
                    variant.name,
                    variant.color && variant.color !== variant.name ? variant.color : null,
                    optionSize(variant.options),
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <button
                      aria-pressed={selected}
                      aria-label={`${label}${variant.inventoryQuantity < 1 ? ", out of stock" : ""}`}
                      className={`min-h-11 rounded-control border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                        selected
                          ? "border-plum bg-plum text-white"
                          : "border-border bg-white text-plum hover:border-gold"
                      }`}
                      key={variant.id}
                      onClick={() => selectVariant(variant.id)}
                      type="button"
                    >
                      {label}
                      {variant.inventoryQuantity < 1 && (
                          <span className="ml-1 text-xs opacity-75">(Out of stock)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {hasSizeOptions && sizeValues.length > 0 && (
            <section aria-labelledby="size-guide-heading" className="mt-6">
              <h2 className="text-sm font-semibold text-plum" id="size-guide-heading">
                Available sizes
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Select from the sizes recorded for this product: {sizeValues.join(", ")}.
                Measurements are not provided in the catalogue.
              </p>
            </section>
          )}

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-muted" htmlFor="product-quantity">
                Quantity
              </label>
              <div className="mt-1 flex h-11 items-center rounded-control border border-border bg-white">
                <button
                  aria-label="Decrease quantity"
                  className="grid size-10 place-items-center text-plum disabled:opacity-40"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  type="button"
                >
                  <Minus aria-hidden="true" className="size-4" />
                </button>
                <input
                  className="w-10 bg-transparent text-center text-sm text-plum outline-none"
                  id="product-quantity"
                  max={Math.max(1, Math.min(99, selectedVariant.inventoryQuantity - existingQuantity))}
                  min={1}
                  onChange={(event) => {
                    const value = Number(event.currentTarget.value);
                    if (Number.isInteger(value)) {
                      setQuantity(Math.min(Math.max(1, value), Math.max(1, selectedVariant.inventoryQuantity)));
                    }
                  }}
                  type="number"
                  value={quantity}
                />
                <button
                  aria-label="Increase quantity"
                  className="grid size-10 place-items-center text-plum disabled:opacity-40"
                  disabled={!inStock || quantity >= Math.min(99, selectedVariant.inventoryQuantity - existingQuantity)}
                  onClick={() =>
                    setQuantity((value) => Math.min(selectedVariant.inventoryQuantity, value + 1))
                  }
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4" />
                </button>
              </div>
            </div>
            <Button
              className="min-w-48 flex-1 sm:flex-none"
              disabled={!inStock || isAdding}
              onClick={addToBag}
              size="lg"
              type="button"
              variant="primary"
            >
              {isAdding ? (
                "Checking availability…"
              ) : inStock ? (
                <>
                  <ShoppingBag aria-hidden="true" className="size-4" />
                  Add to bag
                </>
              ) : (
                <>
                  <Check aria-hidden="true" className="size-4" />
                  Unavailable
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <p className="rounded-control border border-border bg-white p-4 text-sm text-muted">
          Pricing and availability are not currently provided for this item.
        </p>
      )}
    </div>
  );
}
