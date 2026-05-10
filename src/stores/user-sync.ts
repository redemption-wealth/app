"use client";

import { create } from "zustand";

interface UserSyncState {
  isSynced: boolean;
  userId: string | null;
  markSynced: (userId: string) => void;
  reset: () => void;
}

export const useUserSync = create<UserSyncState>((set) => ({
  isSynced: false,
  userId: null,
  markSynced: (userId) => set({ isSynced: true, userId }),
  reset: () => set({ isSynced: false, userId: null }),
}));
