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
      <h1 className="font-display text-2xl font-bold text-[#171717]">Wallet</h1>

      <BalanceCard />

      <WalletDepositPanel />

      <section className="space-y-3">
        <h3 className="font-display text-lg font-bold text-[#171717]">
          Transaksi Terakhir
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-[var(--radius-md)] border border-[#ececec] bg-white p-4"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-between rounded-[var(--radius-lg)] bg-[#fee2e2] p-4 text-sm text-[#b91c1c]">
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
          <div className="rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6 text-center">
            <p className="text-sm text-[#525252]">Belum ada transaksi.</p>
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
  pending: "bg-[#fef3c7] text-[#854d0e]",
  confirmed: "bg-[#dcfce7] text-[#15803d]",
  failed: "bg-[#fee2e2] text-[#b91c1c]",
};

const STATUS_LABELS: Record<Transaction["status"], string> = {
  pending: "Pending",
  confirmed: "Terkonfirmasi",
  failed: "Gagal",
};

function TransactionRow({ tx }: { tx: Transaction }) {
  const isOutflow = tx.type === "withdrawal" || tx.type === "redeem";
  return (
    <li className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#171717]">
            {TYPE_LABELS[tx.type]}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${STATUS_STYLES[tx.status]}`}
          >
            {STATUS_LABELS[tx.status]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#737373]">
          {formatDate(tx.createdAt)}
        </p>
      </div>
      <p className="font-display shrink-0 text-sm font-bold text-[#171717]">
        {isOutflow ? "-" : "+"}
        {formatWealth(tx.amountWealth)}{" "}
        <span className="text-xs font-normal text-[#525252]">$WEALTH</span>
      </p>
    </li>
  );
}
