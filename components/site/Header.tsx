"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X, ShieldCheck, LayoutDashboard, UserRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthTrigger } from "@/components/site/AuthModal";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { useAuth } from "@/lib/auth";
import { useApiOne } from "@/lib/hooks";

interface SiteConfigPublic {
  logoKey?: string | null;
}

export function Header() {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: config } = useApiOne<SiteConfigPublic>("/site-config");
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  const liens = [
    { to: "/", label: t("home") },
    { to: "/a-propos", label: t("about") },
    { to: "/services", label: t("services") },
    { to: "/reglementation", label: t("regulation") },
    { to: "/equipements", label: t("equipment") },
    { to: "/appels-offres", label: t("tenders") },
    { to: "/carrieres", label: t("careers") },
    { to: "/actualites", label: t("news") },
    { to: "/statistiques", label: t("statistics") },
    { to: "/reclamations", label: t("claims") },
    { to: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">

      <div className="container-content flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {config?.logoKey ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo provenant de MinIO (hôte dynamique, non listable dans next.config.js images.domains)
            <img src={config.logoKey} alt="ARPT" className="size-11 shrink-0 rounded-md object-contain" />
          ) : (
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
          )}
          <span className="min-w-0">
            <span className="block font-heading text-lg leading-none font-bold tracking-tight">ARPT</span>
            <span className="block truncate text-[0.7rem] text-muted-foreground">
              Autorité de Régulation des Postes et Télécommunications
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher className="hidden md:flex" />
          {user ? (
            <>
              <Link
                href="/portail"
                className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:text-primary md:inline-flex"
              >
                <UserRound className="size-4" aria-hidden /> {user.fullname.split(" ")[0]}
              </Link>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={() => logout()}>
                <LogOut className="size-4" aria-hidden /> {tc("logout")}
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <AuthTrigger>
                <UserRound className="size-4" aria-hidden /> {tc("login")}
              </AuthTrigger>
            </Button>
          )}
          {(user?.isStaff || user?.isSuperuser || user?.role) && (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/admin">
                <LayoutDashboard className="size-4" aria-hidden /> {tc("administration")}
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label={t("openMenu")}
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
              className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors hover:text-teal-600
                 ${pathname === l.to ? "border-teal-600 text-teal-600" :
                   "border-transparent text-surface-foreground"}`}
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
            <div className="mt-2 flex items-center justify-between gap-2 px-1">
              <LocaleSwitcher />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {user ? (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/portail" onClick={() => setOuvert(false)}>{user.fullname.split(" ")[0]}</Link>
                  </Button>
                  <Button size="sm" onClick={() => { logout(); setOuvert(false); }}>{tc("logout")}</Button>
                </>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <AuthTrigger>{tc("login")}</AuthTrigger>
                </Button>
              )}
              {(user?.isStaff || user?.isSuperuser || user?.role) && (
                <Button asChild size="sm" onClick={() => setOuvert(false)}>
                  <Link href="/admin">{tc("administration")}</Link>
                </Button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
