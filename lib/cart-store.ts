"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { cartLineSchema } from "@/lib/cart-schemas";

export type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
};

type CartStore = {
  lines: CartLine[];
  hasHydrated: boolean;
  addItem: (line: Omit<CartLine, "quantity">, quantity: number) => AddToCartResult;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  getQuantity: (productId: string, variantId: string) => number;
  setHasHydrated: (value: boolean) => void;
  clear: () => void;
};

export type AddToCartResult =
  | { status: "added"; quantity: number }
  | { status: "unavailable" }
  | { status: "full" }
  | { status: "limit"; quantity: number };

export function normalizeCartLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  const normalized = new Map<string, CartLine>();
  for (const candidate of value) {
    const parsed = cartLineSchema.safeParse(candidate);
    if (!parsed.success) continue;

    const line = parsed.data;
    const key = `${line.productId}\u0000${line.variantId}`;
    const existing = normalized.get(key);
    normalized.set(key, {
      ...line,
      quantity: Math.min(99, (existing?.quantity ?? 0) + line.quantity),
    });
  }
  return [...normalized.values()].slice(0, 50);
}

type PersistedCart = Pick<CartStore, "lines">;

const serverStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useCartStore = create<CartStore>()(
  persist<CartStore, [], [], PersistedCart>(
    (set, get) => ({
      lines: [],
      hasHydrated: false,
      addItem: (line, requestedQuantity) => {
        if (
          !line.productId.trim() ||
          !line.variantId.trim() ||
          !Number.isInteger(requestedQuantity) ||
          requestedQuantity < 1
        ) {
          return { status: "unavailable" };
        }

        const existing = get().lines.find(
          (item) =>
            item.productId === line.productId &&
            item.variantId === line.variantId,
        );
        const nextQuantity = (existing?.quantity ?? 0) + requestedQuantity;
        if (nextQuantity > 99) return { status: "limit", quantity: 99 };
        if (!existing && get().lines.length >= 50) return { status: "full" };

        set((state) => ({
          lines: existing
            ? state.lines.map((item) =>
                item.productId === line.productId &&
                item.variantId === line.variantId
                  ? { ...item, quantity: nextQuantity }
                  : item,
              )
            : [...state.lines, { ...line, quantity: requestedQuantity }],
        }));
        return { status: "added", quantity: nextQuantity };
      },
      updateQuantity: (productId, variantId, quantity) => {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
        set((state) => ({
          lines: state.lines.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item,
          ),
        }));
      },
      removeItem: (productId, variantId) =>
        set((state) => ({
          lines: state.lines.filter(
            (item) =>
              item.productId !== productId || item.variantId !== variantId,
          ),
        })),
      getQuantity: (productId, variantId) =>
        get().lines.find(
          (item) =>
            item.productId === productId && item.variantId === variantId,
        )?.quantity ?? 0,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "shringaar-cart",
      storage: createJSONStorage<PersistedCart>(() =>
        typeof window === "undefined" ? serverStorage : window.localStorage,
      ),
      skipHydration: true,
      version: 1,
      partialize: (state) => ({ lines: state.lines }),
      migrate: (persisted) => {
        const lines =
          persisted &&
          typeof persisted === "object" &&
          "lines" in persisted
            ? normalizeCartLines(persisted.lines)
            : [];
        return { lines };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function hydrateCart() {
  return useCartStore.persist.rehydrate();
}
