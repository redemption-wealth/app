"use client";

export function MobileHeader() {
  return (
    <header className="bg-surface-container-lowest/70 sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-xl md:hidden">
      <h1 className="font-display text-primary text-lg font-bold">WEALTH</h1>
      <div className="bg-surface-container h-8 w-8 rounded-full" />
    </header>
  );
}
