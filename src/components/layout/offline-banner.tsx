"use client";

import { onlineManager } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    onlineManager.setOnline(isOnline);
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#fee2e2] px-4 py-2 text-sm font-semibold text-[#b91c1c] shadow-lg md:bottom-6"
    >
      Offline — akan sinkron kembali saat online
    </div>
  );
}
