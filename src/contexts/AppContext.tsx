"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Category, Transaction } from "@/types";

interface AppContextType {
  categories: Category[];
  transactions: Transaction[];
  setCategories: (categories: Category[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  refreshCategories: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        categories,
        transactions,
        setCategories,
        setTransactions,
        refreshCategories,
        refreshTransactions,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
