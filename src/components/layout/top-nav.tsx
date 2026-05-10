"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { useMarketplaceFilter } from "@/stores/marketplace-filter";
import { formatWealth } from "@/lib/utils";

function deriveInitial(email: string | null): string {
  if (!email) return "U";
  const trimmed = email.trim();
  return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : "U";
}

function BalancePill({ value }: { value: string }) {
  return (
    <span
      className="border-primary/30 text-primary inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm font-bold whitespace-nowrap tabular-nums"
      title={`${formatWealth(value)} $WEALTH`}
    >
      <span
        aria-hidden
        className="bg-primary inline-block h-1.5 w-1.5 rounded-full"
      />
      {formatWealth(value)}
      <span className="text-on-surface-variant text-[10px] font-semibold">
        $WEALTH
      </span>
    </span>
  );
}

function AuthControls() {
  const { ready, authenticated, login, logout, email, walletAddress } =
    useAuth();
  const { balance } = useWealthBalance(walletAddress);

  if (!ready) {
    return <Skeleton className="h-9 w-24 rounded-full" />;
  }

  if (!authenticated) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => login()}
        className="rounded-full px-4"
      >
        Masuk
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <BalancePill value={balance} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Menu akun"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-on-primary text-sm font-semibold">
                {deriveInitial(email)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {email ? (
            <>
              <div className="text-muted-foreground truncate px-2 py-1.5 text-xs">
                {email}
              </div>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href="/profile">Profil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              void logout();
            }}
          >
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function NavSearch() {
  const searchQuery = useMarketplaceFilter((s) => s.searchQuery);
  const setSearchQuery = useMarketplaceFilter((s) => s.setSearchQuery);

  return (
    <div className="relative hidden flex-1 md:block md:max-w-xl">
      <Search
        className="text-on-surface-variant pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        placeholder="Cari voucher atau merchant"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="bg-surface-container-low h-10 rounded-full border-transparent pl-9 focus-visible:bg-white"
      />
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const showSearch = pathname === "/";

  return (
    <header className="border-border sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-white/85 px-4 backdrop-blur-md md:gap-6 md:px-8">
      <Link href="/" aria-label="Beranda" className="flex-shrink-0">
        <Image
          src="/image/logo.png"
          alt="WEALTH"
          width={120}
          height={32}
          priority
          className="h-7 w-auto md:h-8"
        />
      </Link>

      {showSearch ? <NavSearch /> : <div className="hidden flex-1 md:block" />}

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <AuthControls />
      </div>
    </header>
  );
}
