"use client";

import { useMutation } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";

export function useSyncUser() {
  return useMutation({
    mutationFn: () => endpoints.syncUser(),
  });
}
