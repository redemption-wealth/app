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
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-error-container text-on-error-container rounded-full px-4 py-2 shadow-lg text-sm font-semibold"
    >
      Offline — akan sinkron kembali saat online
    </div>
  );
}
