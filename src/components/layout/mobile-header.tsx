"use client";

import Image from "next/image";
import { targetChain } from "@/lib/wagmi";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#ececec] bg-white/70 px-4 py-3 backdrop-blur-[16px] md:hidden">
      <Image
        src="/image/logo.png"
        alt="WEALTH"
        width={120}
        height={40}
        priority
        className="h-7 w-auto"
      />
      <div className="flex items-center gap-1.5 text-xs text-[#525252]">
        <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
        <span>{targetChain.name}</span>
      </div>
    </header>
  );
}
