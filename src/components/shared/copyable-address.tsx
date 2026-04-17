"use client";

import { useState } from "react";
import { truncateAddress } from "@/lib/utils";

interface CopyableAddressProps {
  value: string;
  label?: string;
  truncate?: boolean;
}

export function CopyableAddress({
  value,
  label,
  truncate = true,
}: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied; fall back silently.
    }
  };

  return (
    <div className="space-y-1">
      {label ? (
        <p className="text-on-surface-variant text-xs tracking-wide uppercase">
          {label}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleCopy}
        className="bg-surface-container hover:bg-surface-container-high flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left font-mono text-sm transition-colors"
      >
        <span className="truncate">
          {truncate ? truncateAddress(value) : value}
        </span>
        <span className="text-primary shrink-0 font-sans text-xs font-semibold">
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
    </div>
  );
}
