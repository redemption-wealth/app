"use client";

import Image from "next/image";
import Link from "next/link";
import { HeaderAuthControls } from "@/components/layout/header-auth-controls";

export function MobileHeader() {
  return (
    <header className="border-border sticky top-0 z-40 flex items-center justify-between border-b bg-white/70 px-4 py-3 backdrop-blur-[16px] md:hidden">
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
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/merchants" className="text-on-surface-variant font-medium">
          Merchant
        </Link>
        <HeaderAuthControls />
      </nav>
    </header>
  );
}
