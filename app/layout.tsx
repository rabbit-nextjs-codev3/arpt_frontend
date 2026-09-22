import type { Metadata } from "next";
import { Public_Sans, Sora, Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { SiteShell } from "@/components/site/SiteShell";
import { DocumentPreviewProvider } from "@/components/site/DocumentPreview";
import { LocaleProvider } from "@/lib/locale-context";
import { getServerLocale } from "@/lib/locale";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

// La langue vit dans un cookie lu à chaque requête (voir lib/locale.ts) —
// sans forcer le rendu dynamique, Next.js peut mettre la page en cache et
// ignorer un changement de cookie au router.refresh() (même précaution que
// l'ancien frontend, qui utilisait ce même mécanisme).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "ARPT Guinée", template: "%s | ARPT Guinée" },
  description: "Site institutionnel de l'Autorité de Régulation des Postes et Télécommunications de Guinée.",
  openGraph: { type: "website", locale: "fr_GN", siteName: "ARPT Guinée" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={cn(sora.variable, publicSans.variable, "font-sans", geist.variable)}
    >
      <body>
        <LocaleProvider initialLocale={locale}>
          <NextIntlClientProvider messages={messages}>
            <DocumentPreviewProvider><SiteShell>{children}</SiteShell></DocumentPreviewProvider>
          </NextIntlClientProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
