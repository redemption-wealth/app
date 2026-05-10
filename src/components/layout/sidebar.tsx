"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/stores/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  authOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/merchants", label: "Merchant", icon: "store" },
  { href: "/profile", label: "Profil", icon: "user", authOnly: true },
];

const iconMap: Record<string, string> = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  store:
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { authenticated } = useAuth();
  const isCollapsed = useSidebar((s) => s.isCollapsed);

  return (
    <aside
      className={`border-border sticky top-0 hidden h-screen flex-col border-r bg-white transition-all duration-300 md:flex ${
        isCollapsed ? "w-[72px]" : "w-[248px]"
      }`}
    >
      <div className="flex items-center p-6">
        {isCollapsed ? (
          <Image
            src="/image/w-logo.png"
            alt="W"
            width={32}
            height={32}
            priority
            className="h-8 w-8"
          />
        ) : (
          <Image
            src="/image/logo.png"
            alt="WEALTH"
            width={160}
            height={52}
            priority
            className="h-9 w-auto"
          />
        )}
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          if (item.authOnly && !authenticated) return null;
          const isActive = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center gap-3 rounded-full px-4 py-3 transition-colors ${
                isActive
                  ? "bg-surface-active text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-hover"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isActive ? 2 : 1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={iconMap[item.icon]}
                />
              </svg>
              {!isCollapsed && (
                <>
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <span
                      className="bg-primary ml-auto h-1.5 w-1.5 rounded-full"
                      aria-hidden
                    />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
