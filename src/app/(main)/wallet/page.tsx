"use client";

import { BalanceCard } from "@/components/features/balance-card";
import { WalletDepositPanel } from "@/components/features/wallet-deposit-panel";
import { useTransactions } from "@/hooks/use-transactions";
import type { Transaction } from "@/lib/schemas/transaction";
import { formatDate, formatWealth } from "@/lib/utils";

export default function WalletPage() {
  const { data, isLoading, error, refetch } = useTransactions({ limit: 10 });

  const transactions = data?.transactions ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-on-surface text-2xl font-bold">
        Wallet
      </h1>

      <BalanceCard />

      <WalletDepositPanel />

      <section className="space-y-3">
        <h3 className="font-display text-on-surface text-lg font-bold">
          Transaksi Terakhir
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border-border h-16 animate-pulse rounded-[var(--radius-md)] border bg-white p-4"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-error-container text-error flex items-center justify-between rounded-[var(--radius-lg)] p-4 text-sm">
            <span>Gagal memuat transaksi.</span>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="border-border rounded-[var(--radius-lg)] border bg-white p-6 text-center">
            <p className="text-on-surface-variant text-sm">
              Belum ada transaksi.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const TYPE_LABELS: Record<Transaction["type"], string> = {
  deposit: "Deposit",
  withdrawal: "Withdraw",
  redeem: "Redeem",
};

const STATUS_STYLES: Record<Transaction["status"], string> = {
  pending: "bg-tertiary-container text-on-tertiary-container",
  confirmed: "bg-success-container text-on-success-container",
  failed: "bg-error-container text-error",
};

const STATUS_LABELS: Record<Transaction["status"], string> = {
  pending: "Pending",
  confirmed: "Terkonfirmasi",
  failed: "Gagal",
};

function TransactionRow({ tx }: { tx: Transaction }) {
  const isOutflow = tx.type === "withdrawal" || tx.type === "redeem";
  return (
    <li className="border-border flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-on-surface text-sm font-semibold">
            {TYPE_LABELS[tx.type]}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${STATUS_STYLES[tx.status]}`}
          >
            {STATUS_LABELS[tx.status]}
          </span>
        </div>
        <p className="text-outline mt-0.5 text-xs">
          {formatDate(tx.createdAt)}
        </p>
      </div>
      <p className="font-display text-on-surface shrink-0 text-sm font-bold">
        {isOutflow ? "-" : "+"}
        {formatWealth(tx.amountWealth)}{" "}
        <span className="text-on-surface-variant text-xs font-normal">
          $WEALTH
        </span>
      </p>
    </li>
  );
}
