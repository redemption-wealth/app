"use client";

import { useState } from "react";
import { env } from "@/lib/env";
import { truncateAddress } from "@/lib/utils";

interface TransactionInfoProps {
  txHash: string | null;
}

const EXPLORERS = {
  mainnet: { base: "https://etherscan.io", name: "Etherscan" },
  sepolia: { base: "https://sepolia.etherscan.io", name: "Sepolia Etherscan" },
} as const;

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

  const explorer = EXPLORERS[env.NEXT_PUBLIC_CHAIN];

  return (
    <div className="border-border space-y-2 rounded-[var(--radius-lg)] border bg-white p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-outline text-[10px] font-semibold tracking-wide uppercase">
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
      <p className="text-on-surface font-mono text-xs break-all">
        {truncateAddress(txHash)}
      </p>
      <a
        href={`${explorer.base}/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary text-xs font-semibold underline"
      >
        Lihat di {explorer.name} ↗
      </a>
    </div>
  );
}
