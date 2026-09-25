"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function UserMenu({
  className,
  userName,
  onAction,
}: {
  className?: string;
  userName: string;
  onAction?: () => void;
}) {
  const router = useRouter();
  const { logout } = useAuth();

  function openPortal() {
    onAction?.();
    router.push("/portail");
  }

  async function signOut() {
    onAction?.();
    await logout();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu de ${userName}`}
        title={userName}
        className={cn(
          "inline-flex h-10 w-10  p-2 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-xl leading-none shadow-sm transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <span aria-hidden="true">👩‍🚀</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={openPortal}>
          <UserRound aria-hidden />
          <span>Portail</span>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <LogOut aria-hidden />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
