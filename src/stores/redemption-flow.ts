"use client";

import { create } from "zustand";

export type SigningState =
  | "idle"
  | "price-quote"
  | "initiating"
  | "opening-wallet"
  | "awaiting-signature"
  | "broadcasting"
  | "submitting-hash"
  | "polling-confirmation"
  | "done"
  | "wallet-recovering"
  | "error";

interface TxDetails {
  tokenContractAddress: string | null;
  treasuryWalletAddress: string | null;
  wealthAmount: string;
}

// All optional fields are typed `T | undefined` (rather than `T?`) so we can
// assign `undefined` explicitly during reset/initiate. Without this Zustand's
// shallow `set(...)` would leave stale values from a previous run — most
// visibly, an old `error` message keeps rendering inside the modal when a
// new redemption attempt starts.
interface RedemptionFlowState {
  state: SigningState;
  voucherId: string | undefined;
  redemptionId: string | undefined;
  txDetails: TxDetails | undefined;
  txHash: string | undefined;
  error: string | undefined;
  priceLock: number | undefined;
  startedAt: number | undefined;
}

interface RedemptionFlowActions {
  initiate: (voucherId: string) => void;
  transition: (
    next: SigningState,
    patch?: Partial<Omit<RedemptionFlowState, "state">>,
  ) => void;
  setError: (message: string) => void;
  reset: () => void;
}

const ALLOWED_TRANSITIONS: Record<SigningState, readonly SigningState[]> = {
  idle: ["price-quote", "error"],
  "price-quote": ["initiating", "error", "idle"],
  initiating: ["opening-wallet", "polling-confirmation", "error", "idle"],
  "opening-wallet": [
    "awaiting-signature",
    "wallet-recovering",
    "error",
    "idle",
  ],
  "awaiting-signature": ["broadcasting", "wallet-recovering", "error", "idle"],
  broadcasting: ["submitting-hash", "error"],
  "submitting-hash": ["polling-confirmation", "error"],
  "polling-confirmation": ["done", "error"],
  done: ["idle"],
  "wallet-recovering": ["opening-wallet", "error", "idle"],
  error: ["idle"],
};

const MID_FLOW_STATES: readonly SigningState[] = [
  "price-quote",
  "initiating",
  "opening-wallet",
  "awaiting-signature",
  "broadcasting",
  "submitting-hash",
  "polling-confirmation",
  "wallet-recovering",
];

const idleState: RedemptionFlowState = {
  state: "idle",
  voucherId: undefined,
  redemptionId: undefined,
  txDetails: undefined,
  txHash: undefined,
  error: undefined,
  priceLock: undefined,
  startedAt: undefined,
};

export const useRedemptionFlow = create<
  RedemptionFlowState & RedemptionFlowActions
>((set, get) => ({
  ...idleState,

  initiate: (voucherId) =>
    set({
      ...idleState,
      voucherId,
      startedAt: Date.now(),
      state: "price-quote",
    }),

  transition: (next, patch) => {
    const current = get().state;
    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      if (typeof window !== "undefined") {
        console.warn(
          `[redemption-flow] invalid transition ${current} -> ${next}; ignored`,
        );
      }
      return;
    }
    set({ ...(patch ?? {}), state: next });
  },

  setError: (message) =>
    set((prev) => ({ ...prev, state: "error", error: message })),

  reset: () => set(idleState),
}));

export function selectIsSigning(state: RedemptionFlowState): boolean {
  return MID_FLOW_STATES.includes(state.state);
}

export function selectCanCancel(state: RedemptionFlowState): boolean {
  return state.state === "awaiting-signature";
}
