import { create } from "zustand";
import type { Product } from "@/types";

interface ProductState {
  products: Product[];
  isLoading: boolean;
  searchQuery: string;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  isLoading: false,
  searchQuery: "",
  setProducts: (products) => set({ products }),
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  updateProduct: (product) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === product.id ? product : p)),
    })),
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
