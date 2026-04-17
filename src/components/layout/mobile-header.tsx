"use client";

import Image from "next/image";

export function MobileHeader() {
  return (
    <header className="bg-surface-container-lowest/70 sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-xl md:hidden">
      <Image
        src="/image/logo.png"
        alt="WEALTH"
        width={120}
        height={40}
        priority
        className="h-7 w-auto"
      />
      <div className="bg-surface-container h-8 w-8 rounded-full" />
    </header>
  );
}
