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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={dismissable && onClose ? onClose : undefined}
    >
      <div
        className="bg-surface w-full max-w-md rounded-[var(--radius-xl)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
