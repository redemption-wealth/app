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
    <div className="bg-surface-container space-y-2 rounded-[var(--radius-md)] p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-on-surface-variant text-xs tracking-wide uppercase">
          Hash Transaksi
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-primary text-xs font-semibold"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="font-mono text-xs break-all">{truncateAddress(txHash)}</p>
      <a
        href={`https://basescan.org/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary text-xs font-semibold underline"
      >
        Lihat di BaseScan ↗
      </a>
    </div>
  );
}
