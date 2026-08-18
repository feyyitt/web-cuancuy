import { create } from "zustand";
import type { CapitalTransaction } from "@/types";

interface CapitalState {
  transactions: CapitalTransaction[];
  isLoading: boolean;
  setTransactions: (transactions: CapitalTransaction[]) => void;
  addTransaction: (transaction: CapitalTransaction) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useCapitalStore = create<CapitalState>((set) => ({
  transactions: [],
  isLoading: false,
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
