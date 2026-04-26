import Link from "next/link";

const actions = [
  {
    label: "Jelajah",
    href: "/merchants",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  },
  {
    label: "Deposit",
    href: "/wallet",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    label: "Riwayat",
    href: "/history",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "QR Saya",
    href: "/history",
    icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
  },
];

export function QuickActionChips() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="border-border flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
        >
          <svg
            className="text-primary h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={action.icon}
            />
          </svg>
          <span className="text-on-surface-variant text-[11px] font-semibold">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
