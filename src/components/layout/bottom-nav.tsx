"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { iconMap } from "@/components/layout/sidebar";

const navItems = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/merchants", label: "Merchant", icon: "store" },
  { href: "/wallet", label: "Wallet", icon: "wallet" },
  { href: "/history", label: "Riwayat", icon: "history" },
  { href: "/profile", label: "Profil", icon: "user" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-border fixed right-0 bottom-0 left-0 z-50 border-t bg-white/70 backdrop-blur-[16px] md:hidden">
      <div className="flex justify-around pt-2 pb-3">
        {navItems.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive ? "text-primary" : "text-outline"
              }`}
            >
              <svg
                className="h-6 w-6"
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
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
