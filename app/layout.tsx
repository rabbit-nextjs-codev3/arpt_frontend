import type { Metadata } from "next";
import { Public_Sans, Sora, Geist } from "next/font/google";
import { SiteShell } from "@/components/site/SiteShell";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "ARPT Guinée", template: "%s | ARPT Guinée" },
  description: "Site institutionnel de l'Autorité de Régulation des Postes et Télécommunications de Guinée.",
  openGraph: { type: "website", locale: "fr_GN", siteName: "ARPT Guinée" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={cn(sora.variable, publicSans.variable, "font-sans", geist.variable)}
    >
      <body><SiteShell>{children}</SiteShell></body>
    </html>
  );
}
