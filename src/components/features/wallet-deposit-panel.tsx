"use client";

import { CopyableAddress } from "@/components/shared/copyable-address";
import { useAuth } from "@/hooks/use-auth";
import { env } from "@/lib/env";

interface WalletDepositPanelProps {
  variant?: "card" | "inline";
}

export function WalletDepositPanel({ variant = "card" }: WalletDepositPanelProps) {
  const { walletAddress } = useAuth();

  const wrapperClasses =
    variant === "card"
      ? "bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 space-y-6"
      : "space-y-6";

  return (
    <section className={wrapperClasses}>
      <div className="space-y-2">
        <h3 className="font-display text-lg font-bold">
          Deposit $WEALTH ke embedded wallet
        </h3>
        <p className="text-sm text-on-surface-variant">
          Kirim $WEALTH dari bursa atau dompet lain ke alamat di bawah. Saldo
          muncul otomatis setelah transaksi terkonfirmasi di jaringan Base.
        </p>
      </div>

      <ol className="space-y-5">
        <li className="space-y-2">
          <Step index={1} title="Alamat embedded wallet Anda" />
          {walletAddress ? (
            <CopyableAddress value={walletAddress} truncate={false} />
          ) : (
            <p className="text-sm text-on-surface-variant">
              Dompet belum siap. Silakan refresh halaman jika tidak muncul
              dalam beberapa detik.
            </p>
          )}
        </li>

        <li className="space-y-2">
          <Step index={2} title="Pastikan pakai jaringan Base" />
          <div className="bg-surface-container rounded-[var(--radius-md)] px-3 py-2 text-sm flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="font-semibold">Base Mainnet</span>
            <span className="text-on-surface-variant">· Chain ID 8453</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Transfer dari jaringan lain (mis. Ethereum Mainnet) tidak akan
            terdeteksi dan bisa menyebabkan dana hilang.
          </p>
        </li>

        <li className="space-y-2">
          <Step index={3} title="Kirim token $WEALTH ke alamat di atas" />
          <CopyableAddress
            label="Kontrak $WEALTH (Base)"
            value={env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS}
            truncate={false}
          />
          <p className="text-xs text-on-surface-variant">
            Saat menambah custom token di dompet sumber, gunakan alamat kontrak
            di atas agar token dikenali sebagai $WEALTH.
          </p>
        </li>
      </ol>
    </section>
  );
}

function Step({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-semibold">
        {index}
      </span>
      <h4 className="font-display text-base font-semibold">{title}</h4>
    </div>
  );
}
