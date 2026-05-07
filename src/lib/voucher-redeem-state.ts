export type RedeemState =
  | "unauth"
  | "wrong-chain"
  | "loading"
  | "insufficient"
  | "redeem";

export interface DeriveRedeemStateInput {
  authenticated: boolean;
  userSynced: boolean;
  onWrongChain: boolean;
  rawBalance: bigint | undefined;
  requiredAmount: bigint | null;
}

export function deriveRedeemState({
  authenticated,
  userSynced,
  onWrongChain,
  rawBalance,
  requiredAmount,
}: DeriveRedeemStateInput): RedeemState {
  if (!authenticated || !userSynced) return "unauth";
  if (onWrongChain) return "wrong-chain";
  if (rawBalance === undefined || requiredAmount === null) return "loading";
  if (rawBalance < requiredAmount) return "insufficient";
  return "redeem";
}
