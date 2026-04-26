"use client";

import Image from "next/image";
import { targetChain } from "@/lib/wagmi";

export function MobileHeader() {
  return (
    <header className="border-border sticky top-0 z-40 flex items-center justify-between border-b bg-white/70 px-4 py-3 backdrop-blur-[16px] md:hidden">
      <Image
        src="/image/logo.png"
        alt="WEALTH"
        width={120}
        height={40}
        priority
        className="h-7 w-auto"
      />
      <div className="text-on-surface-variant flex items-center gap-1.5 text-xs">
        <span className="bg-success h-2 w-2 rounded-full" />
        <span>{targetChain.name}</span>
      </div>
    </header>
  );
}
