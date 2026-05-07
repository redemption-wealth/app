"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

function deriveInitial(email: string | null): string {
  if (!email) return "U";
  const trimmed = email.trim();
  return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : "U";
}

export function HeaderAuthControls() {
  const router = useRouter();
  const { ready, authenticated, login, logout, email } = useAuth();

  if (!ready) {
    return <Skeleton className="h-9 w-20 rounded-full" />;
  }

  if (!authenticated) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => login()}
        className="rounded-full"
      >
        Masuk
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Menu akun"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={undefined} alt={email ?? "Akun"} />
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
        <DropdownMenuItem onSelect={() => router.push("/profile")}>
          Profil
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
  );
}
