import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ResultadoBusqueda } from "./types";

export interface CartItem {
  id: string; // farmacia_id + medicamento_id
  medicamento: ResultadoBusqueda["medicamento"];
  farmacia: ResultadoBusqueda["farmacia"];
  precio: number;
  cantidad: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (resultado: ResultadoBusqueda) => void;
  removeItem: (id: string) => void;
  updateCantidad: (id: string, cantidad: number) => void;
  clear: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (resultado) => {
        const id = `${resultado.farmacia.id}-${resultado.medicamento.id}`;
        const existing = get().items.find((i) => i.id === id);
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i
            ),
          }));
        } else {
          set((s) => ({
            items: [
              ...s.items,
              {
                id,
                medicamento: resultado.medicamento,
                farmacia: resultado.farmacia,
                precio: resultado.precio,
                cantidad: 1,
              },
            ],
          }));
        }
      },

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      updateCantidad: (id, cantidad) => {
        if (cantidad < 1) {
          set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
        } else {
          set((s) => ({
            items: s.items.map((i) => (i.id === id ? { ...i, cantidad } : i)),
          }));
        }
      },

      clear: () => set({ items: [] }),
    }),
    { name: "keiro-cart" }
  )
);

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.cantidad, 0);
}

// Agrupa items por farmacia para el checkout
export function itemsPorFarmacia(items: CartItem[]) {
  const groups = new Map<string, { farmacia: CartItem["farmacia"]; items: CartItem[] }>();
  for (const item of items) {
    const fid = item.farmacia.id;
    if (!groups.has(fid)) {
      groups.set(fid, { farmacia: item.farmacia, items: [] });
    }
    groups.get(fid)!.items.push(item);
  }
  return Array.from(groups.values());
}
