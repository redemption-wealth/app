"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  dismissable?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
}

export function Modal({
  open,
  onClose,
  dismissable = false,
  children,
  ariaLabel,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !dismissable || !onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, dismissable, onClose]);

  if (!open) return null;

  const canDismissByBackdrop = dismissable && onClose;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {canDismissByBackdrop ? (
        <button
          type="button"
          aria-label="Tutup"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-black/50"
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-black/50" />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="relative w-full max-w-md rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-modal)]"
      >
        {children}
      </div>
    </div>
  );
}
