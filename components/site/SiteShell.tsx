"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/site/AuthModal";
import { AuthStateProvider } from "@/lib/auth";
import { useApiOne } from "@/lib/hooks";

interface ThemeColorsPublic {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  textPrimary?: string;
  textSecondary?: string;
  success?: string;
  warning?: string;
  danger?: string;
}

interface SiteConfigPublic {
  themeColors?: ThemeColorsPublic;
}

/**
 * Couleurs choisies par l'admin (Configuration > Apparence) → variables CSS
 * du site public uniquement (jamais l'admin, qui garde sa charte propre —
 * voir `isAdmin` plus bas). Seules les clés effectivement définies sont
 * surchargées, le reste retombe sur les valeurs par défaut de globals.css.
 * `--primary-deep` (dégradé `bg-institution`) est dérivé de `--primary` via
 * `color-mix` plutôt que demandé séparément à l'admin — un choix de couleur
 * suffit, pas dix nuances à assortir à la main.
 */
function buildThemeStyle(
  colors: ThemeColorsPublic | undefined,
): React.CSSProperties {
  if (!colors) return {};
  const style: Record<string, string> = {};
  if (colors.primary) {
    style["--primary"] = colors.primary;
    style["--primary-deep"] =
      `color-mix(in oklab, ${colors.primary} 65%, black)`;
    style["--ring"] = colors.primary;
    style["--chart-1"] = colors.primary;
  }
  if (colors.secondary) style["--secondary"] = colors.secondary;
  if (colors.accent) style["--accent"] = colors.accent;
  if (colors.background) style["--background"] = colors.background;
  if (colors.surface) style["--surface"] = colors.surface;
  if (colors.textPrimary) style["--foreground"] = colors.textPrimary;
  if (colors.textSecondary) style["--muted-foreground"] = colors.textSecondary;
  if (colors.success) style["--success"] = colors.success;
  if (colors.warning) style["--warning"] = colors.warning;
  if (colors.danger) style["--destructive"] = colors.danger;
  return style as React.CSSProperties;
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const isAdmin = usePathname() === "/admin";
  const { data: config } = useApiOne<SiteConfigPublic>(
    isAdmin ? null : "/site-config",
  );
  const themeStyle = buildThemeStyle(config?.themeColors);
  return (
    <AuthStateProvider>
      <AuthProvider>
        <div
          style={isAdmin ? undefined : themeStyle}
          className={
            isAdmin
              ? "flex h-screen overflow-hidden"
              : "flex min-h-screen flex-col"
          }
        >
          {!isAdmin && <Header />}
          <main
            className={isAdmin ? "min-h-0 flex-1 overflow-hidden" : "flex-1"}
          >
            {children}
          </main>
          {!isAdmin && <Footer />}
          <Toaster richColors position="top-right" />
        </div>
      </AuthProvider>
    </AuthStateProvider>
  );
}
