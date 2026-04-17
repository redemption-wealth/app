"use client";

import { useMutation } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import type { RedeemVoucherRequest } from "@/lib/schemas/redemption";

interface InitiateRedemptionInput {
  voucherId: string;
  body: RedeemVoucherRequest;
}

export function useInitiateRedemption() {
  return useMutation({
    mutationFn: ({ voucherId, body }: InitiateRedemptionInput) =>
      endpoints.redeemVoucher(voucherId, body),
  });
}
