"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { HeaderAuthControls } from "@/components/layout/header-auth-controls";
import { useAuth } from "@/hooks/use-auth";

type NavItem = {
  href: string;
  label: string;
  authOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Beranda" },
  { href: "/merchants", label: "Merchant" },
  { href: "/profile", label: "Profil", authOnly: true },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { authenticated } = useAuth();

  return (
    <>
      <header className="border-border sticky top-0 z-40 flex items-center gap-3 border-b bg-white/70 px-4 py-3 backdrop-blur-[16px] md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-on-surface-variant hover:bg-surface-hover rounded-[var(--radius-md)] p-2 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" aria-label="Beranda" className="flex-shrink-0">
          <Image
            src="/image/logo.png"
            alt="WEALTH"
            width={120}
            height={40}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <div className="flex-1" />

        <HeaderAuthControls />
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="h-full w-[280px] bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <Image
                src="/image/logo.png"
                alt="WEALTH"
                width={120}
                height={40}
                priority
                className="h-7 w-auto"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="text-on-surface-variant hover:bg-surface-hover rounded-[var(--radius-md)] p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                if (item.authOnly && !authenticated) return null;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-[var(--radius-md)] px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? "text-primary bg-surface-active font-bold"
                        : "text-on-surface-variant hover:bg-surface-hover"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
