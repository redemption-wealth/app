"use client";

import { CopyableAddress } from "@/components/shared/copyable-address";
import { useAuth } from "@/hooks/use-auth";
import { env } from "@/lib/env";
import { targetChain } from "@/lib/wagmi";

interface WalletDepositPanelProps {
  variant?: "card" | "inline";
}

export function WalletDepositPanel({
  variant = "card",
}: WalletDepositPanelProps) {
  const { walletAddress } = useAuth();

  const wrapperClasses =
    variant === "card"
      ? "rounded-[var(--radius-lg)] border border-border bg-white p-6 space-y-5"
      : "space-y-5";

  return (
    <section className={wrapperClasses}>
      <ol className="space-y-5">
        <li className="space-y-2">
          <Step index={1} title="Alamat embedded wallet kamu" />
          {walletAddress ? (
            <CopyableAddress value={walletAddress} truncate={false} />
          ) : (
            <p className="text-on-surface-variant text-sm">
              Dompet belum siap. Silakan refresh halaman.
            </p>
          )}
        </li>

        <li className="space-y-2">
          <Step index={2} title="Pakai jaringan yang benar" />
          <div className="border-border bg-surface flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm">
            <span className="bg-primary inline-block h-2 w-2 rounded-full" />
            <span className="text-on-surface font-semibold">
              {targetChain.name}
            </span>
            <span className="text-on-surface-variant">
              · Chain ID {targetChain.id}
            </span>
          </div>
        </li>

        <li className="space-y-2">
          <Step index={3} title="Kirim $WEALTH ke alamat di atas" />
          <CopyableAddress
            label={`Kontrak $WEALTH (${targetChain.name})`}
            value={env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS}
            truncate={false}
          />
        </li>
      </ol>
    </section>
  );
}

function Step({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-primary flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-white">
        {index}
      </span>
      <h4 className="font-display text-on-surface text-sm font-bold md:text-base">
        {title}
      </h4>
    </div>
  );
}
