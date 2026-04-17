"use client";

import { useState } from "react";
import { truncateAddress } from "@/lib/utils";

interface TransactionInfoProps {
  txHash: string | null;
}

export function TransactionInfo({ txHash }: TransactionInfoProps) {
  const [copied, setCopied] = useState(false);

  if (!txHash) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-surface-container rounded-[var(--radius-md)] p-3 text-sm space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-on-surface-variant">
          Hash Transaksi
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-semibold text-primary"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="font-mono text-xs break-all">{truncateAddress(txHash)}</p>
      <a
        href={`https://basescan.org/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-semibold text-primary underline"
      >
        Lihat di BaseScan ↗
      </a>
    </div>
  );
}
