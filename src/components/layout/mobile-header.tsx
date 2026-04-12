"use client";

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-container-lowest/70 backdrop-blur-xl sticky top-0 z-40">
      <h1 className="font-display text-lg font-bold text-primary">
        WEALTH
      </h1>
      <div className="w-8 h-8 rounded-full bg-surface-container" />
    </header>
  );
}
