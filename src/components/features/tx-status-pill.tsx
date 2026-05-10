import type { HistoryEntry } from "@/lib/schemas/history-entry";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  HistoryEntry["status"],
  { label: string; classes: string }
> = {
  pending: {
    label: "Menunggu",
    classes: "bg-tertiary-container text-on-tertiary-container",
  },
  confirmed: {
    label: "Berhasil",
    classes: "bg-success-container text-on-success-container",
  },
  failed: {
    label: "Gagal",
    classes: "bg-error-container text-on-error-container",
  },
  expired: {
    label: "Kedaluwarsa",
    classes: "bg-surface-container-high text-outline-variant",
  },
};

export function TxStatusPill({
  status,
  className,
}: {
  status: HistoryEntry["status"];
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap uppercase",
        style.classes,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
