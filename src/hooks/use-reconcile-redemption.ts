"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "./query-keys";

const COOLDOWN_MS = 10_000;

interface UseReconcileRedemptionResult {
  reconcile: (id: string) => void;
  isReconciling: boolean;
  isCoolingDown: boolean;
  fallbackMessage: string | null;
}

export function useReconcileRedemption(): UseReconcileRedemptionResult {
  const queryClient = useQueryClient();
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: (id: string) => endpoints.reconcileRedemption(id),
    onSuccess: (_data, id) => {
      setFallbackMessage(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.redemption(id) });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isNotFound) {
        setFallbackMessage(
          "Fitur refresh belum tersedia. Hubungi support jika perlu bantuan.",
        );
      } else {
        setFallbackMessage(
          err instanceof Error ? err.message : "Gagal memeriksa status.",
        );
      }
    },
  });

  const reconcile = useCallback(
    (id: string) => {
      if (isCoolingDown || mutation.isPending) return;
      mutation.mutate(id);
      setIsCoolingDown(true);
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      cooldownTimer.current = setTimeout(
        () => setIsCoolingDown(false),
        COOLDOWN_MS,
      );
    },
    [isCoolingDown, mutation],
  );

  return {
    reconcile,
    isReconciling: mutation.isPending,
    isCoolingDown,
    fallbackMessage,
  };
}
