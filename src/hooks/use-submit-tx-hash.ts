"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./query-keys";

interface SubmitTxInput {
  redemptionId: string;
  txHash: string;
}

export function useSubmitTxHash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ redemptionId, txHash }: SubmitTxInput) =>
      endpoints.submitTxHash(redemptionId, txHash),
    onSuccess: (_data, { redemptionId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.redemption(redemptionId),
      });
    },
  });
}
