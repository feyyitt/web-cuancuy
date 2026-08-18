import { create } from "zustand";
import type { Sale } from "@/types";

interface SalesState {
  sales: Sale[];
  isLoading: boolean;
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Sale) => void;
  removeSale: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useSalesStore = create<SalesState>((set) => ({
  sales: [],
  isLoading: false,
  setSales: (sales) => set({ sales }),
  addSale: (sale) =>
    set((state) => ({ sales: [sale, ...state.sales] })),
  removeSale: (id) =>
    set((state) => ({
      sales: state.sales.filter((s) => s.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
