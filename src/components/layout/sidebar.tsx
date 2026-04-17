"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/merchants", label: "Merchant", icon: "store" },
  { href: "/wallet", label: "Wallet", icon: "wallet" },
  { href: "/history", label: "Riwayat", icon: "history" },
  { href: "/profile", label: "Profil", icon: "user" },
];

const iconMap: Record<string, string> = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  store:
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  wallet:
    "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  history: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-surface-container-low sticky top-0 hidden h-screen w-64 flex-col md:flex">
      <div className="p-6">
        <Image
          src="/image/logo.png"
          alt="WEALTH"
          width={160}
          height={52}
          priority
          className="h-9 w-auto"
        />
        <p className="text-on-surface-variant mt-2 text-xs">Redemption App</p>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors ${
                isActive
                  ? "bg-surface-container-lowest text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={iconMap[item.icon]}
                />
              </svg>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
