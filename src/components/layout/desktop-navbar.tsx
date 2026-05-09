"use client";

import { PanelLeftClose, PanelLeft } from "lucide-react";
import { HeaderAuthControls } from "@/components/layout/header-auth-controls";
import { useSidebar } from "@/stores/sidebar";

export function DesktopNavbar() {
  const { toggle, isCollapsed } = useSidebar();

  return (
    <header className="border-border sticky top-0 z-40 hidden items-center justify-between border-b bg-white/70 px-6 py-3 backdrop-blur-[16px] md:flex">
      <button
        onClick={toggle}
        className="text-on-surface-variant hover:bg-surface-hover rounded-[var(--radius-md)] p-2 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? (
          <PanelLeft className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>
      <HeaderAuthControls />
    </header>
  );
}
