"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/merchants", label: "Merchant", icon: "store" },
  { href: "/wallet", label: "Wallet", icon: "wallet" },
  { href: "/history", label: "Riwayat", icon: "history" },
  { href: "/profile", label: "Profil", icon: "user" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-surface-container-lowest/70 fixed right-0 bottom-0 left-0 z-50 backdrop-blur-xl md:hidden">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <div className="h-6 w-6" />
              <span className="text-[10px] font-bold tracking-widest uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
