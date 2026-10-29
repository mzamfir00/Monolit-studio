"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Branch } from "@/lib/types";

/** One configured piece. Items from any branch live side by side in the Universal Cart. */
export interface CartItem {
  id: string;
  branch: Branch;
  slug: string;
  name: string;
  variantName: string;
  unitPriceBani: number;
  quantity: number;
  /** Human-readable engraving summary shown in the cart, e.g. "Față: BRUNO · Verso: 07xx". */
  engravingSummary?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      // Each configured engraving is unique, so every add is its own line.
      addItem: (item) => set((state) => ({ items: [...state.items, { ...item, id: crypto.randomUUID() }], isOpen: true })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
        })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "maison-gravure-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((sum, item) => sum + item.unitPriceBani * item.quantity, 0);

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards — gates UI that depends on persisted state. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
