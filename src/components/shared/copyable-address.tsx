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
        <p className="text-xs text-on-surface-variant uppercase tracking-wide">
          {label}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleCopy}
        className="w-full text-left font-mono text-sm bg-surface-container rounded-[var(--radius-md)] px-3 py-2 hover:bg-surface-container-high transition-colors flex items-center justify-between gap-2"
      >
        <span className="truncate">
          {truncate ? truncateAddress(value) : value}
        </span>
        <span className="text-xs text-primary font-sans font-semibold shrink-0">
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
    </div>
  );
}
