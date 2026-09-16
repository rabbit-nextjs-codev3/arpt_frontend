"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShieldCheck, LayoutDashboard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthTrigger } from "@/components/site/AuthModal";
import Image from "next/image";

const liens = [
  { to: "/", label: "Accueil" },
  { to: "/a-propos", label: "L'Autorité" },
  { to: "/services", label: "Services" },
  { to: "/reglementation", label: "Réglementation" },
  { to: "/equipements", label: "Équipements" },
  { to: "/appels-offres", label: "Appels d'offres" },
  { to: "/carrieres", label: "Carrières" },
  { to: "/actualites", label: "Actualités" },
  { to: "/statistiques", label: "Statistiques" },
  { to: "/reclamations", label: "Réclamations" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-content flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="min-w-0">
            <span className="relative block h-8 w-8 shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10">
              <Image
                src="/images/arpt/new-logo.png"
                alt="ARPT logo"
                fill
                sizes="(min-width: 768px) 40px, 32px"
                className="object-contain"
                priority
              />
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex"
          >
            <AuthTrigger>
              <UserRound className="size-4" aria-hidden /> Se connecter
            </AuthTrigger>
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/admin">
              <LayoutDashboard className="size-4" aria-hidden /> Administration
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Ouvrir le menu"
            onClick={() => setOuvert((v) => !v)}
          >
            {ouvert ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <nav className="hidden border-t border-border bg-surface lg:block">
        <div className="container-content flex flex-wrap items-center gap-x-1">
          {liens.map((l) => (
            <Link
              key={l.to}
              href={l.to}
              className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors hover:text-primary ${pathname === l.to ? "border-primary text-primary" : "border-transparent text-surface-foreground"}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      {ouvert && (
        <nav className="border-t border-border bg-surface lg:hidden">
          <div className="container-content grid gap-1 py-3">
            {liens.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                onClick={() => setOuvert(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${pathname === l.to ? "bg-accent text-accent-foreground" : ""}`}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <AuthTrigger>Se connecter</AuthTrigger>
              </Button>
              <Button asChild size="sm" onClick={() => setOuvert(false)}>
                <Link href="/admin">Administration</Link>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
