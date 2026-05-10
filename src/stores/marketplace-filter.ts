"use client";

import { create } from "zustand";

interface MarketplaceFilterState {
  searchQuery: string;
  activeCategoryId: string | null;
  selectedMerchantIds: string[];
  priceRange: [number, number] | null;

  setSearchQuery: (q: string) => void;
  setActiveCategoryId: (id: string | null) => void;
  toggleMerchant: (id: string) => void;
  setSelectedMerchantIds: (ids: string[]) => void;
  resetMerchants: () => void;
  setPriceRange: (range: [number, number] | null) => void;
  resetAll: () => void;
}

export const useMarketplaceFilter = create<MarketplaceFilterState>((set) => ({
  searchQuery: "",
  activeCategoryId: null,
  selectedMerchantIds: [],
  priceRange: null,

  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveCategoryId: (id) =>
    set({ activeCategoryId: id, selectedMerchantIds: [] }),
  toggleMerchant: (id) =>
    set((state) => ({
      selectedMerchantIds: state.selectedMerchantIds.includes(id)
        ? state.selectedMerchantIds.filter((m) => m !== id)
        : [...state.selectedMerchantIds, id],
    })),
  setSelectedMerchantIds: (ids) => set({ selectedMerchantIds: ids }),
  resetMerchants: () => set({ selectedMerchantIds: [] }),
  setPriceRange: (range) => set({ priceRange: range }),
  resetAll: () =>
    set({
      searchQuery: "",
      activeCategoryId: null,
      selectedMerchantIds: [],
      priceRange: null,
    }),
}));
