"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BriefcaseBusiness,
  Gavel,
  LayoutDashboard,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthTrigger } from "@/components/site/AuthModal";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { UserMenu } from "@/components/site/UserMenu";
import { useAuth } from "@/lib/auth";
import { useApiOne } from "@/lib/hooks";

interface SiteConfigPublic {
  logoKey?: string | null;
}

export function Header() {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: config } = useApiOne<SiteConfigPublic>("/site-config");
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  const actions = [
    { to: "/appels-offres", label: t("tenders"), icon: Gavel },
    { to: "/carrieres", label: t("jobOffers"), icon: BriefcaseBusiness },
  ] as const;

  const liens = [
    { to: "/", label: t("home") },
    { to: "/a-propos", label: t("about") },
    { to: "/services", label: t("services") },
    { to: "/reglementation", label: t("regulation") },
    { to: "/equipements", label: t("equipment") },
    { to: "/actualites", label: t("news") },
    { to: "/indicateurs-des-marches", label: t("statistics") },
    { to: "/reclamations", label: t("claims") },
    { to: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-t-2 border-primary bg-background/95 shadow-sm backdrop-blur">
      <div className="border-b border-border">
        <div className="container-content grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {config?.logoKey && (
              <Image
                src={config.logoKey}
                width={52}
                height={52}
                alt="ARPT"
                className="size-11 shrink-0 rounded-md object-contain sm:size-13"
              />
            )}
            <span className="hidden min-w-0 xl:block">
              <span className="block font-heading text-lg leading-none font-bold tracking-tight">
                ARPT
              </span>
              <span className="mt-1 block max-w-64 truncate text-[0.7rem] text-muted-foreground">
                Autorité de Régulation des Postes et Télécommunications
              </span>
            </span>
          </Link>

          <div className="hidden items-center justify-center gap-5 md:flex">
            {actions.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                href={to}
                className={`inline-flex min-h-8 w-full max-w-50 items-center justify-center gap-2 rounded-lg  text-center text-sm font-bold
               tracking-wide uppercase shadow-md transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg
               ${pathname === to ? "bg-teal-700 text-white ring-2 ring-teal-700/20" : "bg-teal-600 text-white"}`}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <LocaleSwitcher className="hidden md:flex" />
            {user ? (
              <UserMenu
                userName={user.fullname}
                className="hidden lg:inline-flex"
              />
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden lg:inline-flex"
              >
                <AuthTrigger>
                  <UserRound aria-hidden />
                  {tc("login")}
                </AuthTrigger>
              </Button>
            )}
            {(user?.isStaff || user?.isSuperuser || user?.role) && (
              <Button asChild size="sm" className="hidden lg:inline-flex">
                <Link href="/admin">
                  <LayoutDashboard aria-hidden />
                  {tc("administration")}
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label={t("openMenu")}
              onClick={() => setOuvert((value) => !value)}
            >
              {ouvert ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        <div className="container-content grid grid-cols-2 gap-2 pb-3 md:hidden">
          {actions.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              href={to}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-600 px-3 text-center text-[0.7rem] font-bold tracking-wide text-white uppercase shadow-sm hover:bg-teal-700"
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <nav className="hidden bg-surface lg:block">
        <div className="container-content flex flex-wrap items-center justify-center gap-x-1">
          {liens.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors hover:text-teal-600 ${pathname === link.to ? "border-teal-600 text-teal-600" : "border-transparent text-surface-foreground"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {ouvert && (
        <nav className="border-t border-border bg-surface lg:hidden">
          <div className="container-content grid gap-1 py-3">
            {liens.map((link) => (
              <Link
                key={link.to}
                href={link.to}
                onClick={() => setOuvert(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${pathname === link.to ? "bg-accent text-accent-foreground" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between gap-2 px-1">
              <LocaleSwitcher />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {user ? (
                <UserMenu
                  userName={user.fullname}
                  onAction={() => setOuvert(false)}
                  className="w-full"
                />
              ) : (
                <Button asChild variant="outline" size="sm">
                  <AuthTrigger>{tc("login")}</AuthTrigger>
                </Button>
              )}
              {(user?.isStaff || user?.isSuperuser || user?.role) && (
                <Button asChild size="sm">
                  <Link href="/admin" onClick={() => setOuvert(false)}>
                    {tc("administration")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
