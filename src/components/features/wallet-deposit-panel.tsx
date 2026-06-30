"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { targetChain } from "@/lib/wagmi";

interface WalletDepositPanelProps {
  variant?: "card" | "inline";
}

export function WalletDepositPanel({
  variant = "card",
}: WalletDepositPanelProps) {
  const { walletAddress } = useAuth();
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const wrapperClasses =
    variant === "card"
      ? "rounded-[var(--radius-lg)] border border-border bg-white p-6 space-y-4"
      : "space-y-4";

  return (
    <section className={wrapperClasses}>
      {/* Safety warning — wrong network/token loses funds permanently */}
      <div className="bg-tertiary-container flex items-start gap-2.5 rounded-[var(--radius-md)] px-3.5 py-3">
        <svg
          className="text-warning mt-px h-5 w-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <p className="text-on-tertiary-container text-[13px] leading-relaxed">
          Kirim <span className="font-bold">hanya</span> di jaringan{" "}
          <span className="font-bold">{targetChain.name}</span> dan token{" "}
          <span className="font-bold">$WEALTH</span>. Salah jaringan atau token
          membuat dana <span className="font-bold">hilang permanen</span>.
        </p>
      </div>

      {/* 1 — Network */}
      <div className="space-y-1.5">
        <p className="text-on-surface-variant text-[11px] font-bold tracking-wider uppercase">
          Jaringan
        </p>
        <div className="border-border bg-surface flex items-center gap-2.5 rounded-[var(--radius-md)] border px-3.5 py-2.5">
          <EthereumMark className="h-5 w-5 shrink-0" />
          <span className="text-on-surface font-semibold">
            {targetChain.name}
          </span>
          <span className="text-on-success-container ml-auto inline-flex items-center gap-1 text-xs font-semibold">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            Benar
          </span>
        </div>
      </div>

      {/* 2 — Destination address */}
      <div className="space-y-1.5">
        <p className="text-on-surface-variant text-[11px] font-bold tracking-wider uppercase">
          Alamat dompet kamu
        </p>
        <p className="text-on-surface-variant text-[13px]">
          Kirim $WEALTH ke alamat ini 👇
        </p>
        {walletAddress ? (
          <div className="space-y-2">
            <div className="border-border bg-surface rounded-[var(--radius-md)] border px-3.5 py-3">
              <p className="text-on-surface font-mono text-[13px] leading-relaxed break-all select-all">
                {walletAddress}
              </p>
            </div>
            <button
              type="button"
              onClick={copyAddress}
              className="bg-primary hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
            >
              {copied ? (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  Alamat tersalin
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                    />
                  </svg>
                  Salin Alamat
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="text-on-surface-variant text-sm">
            Dompet belum siap. Silakan refresh halaman.
          </p>
        )}
      </div>
    </section>
  );
}

/** Ethereum diamond logo mark (single colour, scales cleanly at small sizes). */
function EthereumMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 512" fill="#627EEA">
      <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z" />
    </svg>
  );
}
