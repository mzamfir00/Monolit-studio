"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { EngravingConfig } from "@/lib/engraving";
import { quoteLine, type LinePricing } from "@/lib/pricing";
import type { Branch } from "@/lib/types";

/** One configured piece. Lines from every branch live side by side in the Universal Cart. */
export interface CartItem {
  id: string;
  branch: Branch;
  slug: string;
  name: string;
  quantity: number;
  /** Blanks in stock when the item was added — the quantity ceiling. */
  maxQuantity: number;
  pricing: LinePricing;
  engraving: EngravingConfig;
  addedAt: number;
}

export type NewCartItem = Omit<CartItem, "id" | "addedAt">;

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Adds a configured piece; an identical configuration of the same product just raises the quantity. */
  addItem: (item: NewCartItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

const sameEngraving = (a: CartItem | NewCartItem, b: CartItem | NewCartItem) =>
  a.slug === b.slug && JSON.stringify(a.engraving) === JSON.stringify(b.engraving);

const clamp = (quantity: number, max: number) => Math.min(Math.max(1, Math.round(quantity) || 1), Math.max(1, max));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((candidate) => sameEngraving(candidate, item));
          const items = existing
            ? state.items.map((candidate) =>
                candidate === existing
                  ? { ...candidate, quantity: clamp(candidate.quantity + item.quantity, item.maxQuantity) }
                  : candidate,
              )
            : [
                ...state.items,
                { ...item, quantity: clamp(item.quantity, item.maxQuantity), id: crypto.randomUUID(), addedAt: Date.now() },
              ];
          return { items, isOpen: true };
        }),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity: clamp(quantity, item.maxQuantity) } : item)),
        })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "maison-gravure-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // v0 lines carried no engraving configuration and cannot be produced — drop them.
      migrate: () => ({ items: [] }),
    },
  ),
);

export const lineQuote = (item: CartItem) => quoteLine(item.pricing, item.quantity);
export const cartCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((sum, item) => sum + lineQuote(item).totalBani, 0);

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards — gates UI that depends on persisted state. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
