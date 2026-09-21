"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthTrigger } from "@/components/site/AuthModal";
import { useApiOne } from "@/lib/hooks";

// lucide-react (v1.x) n'inclut plus les icônes de marques (Facebook, X,
// LinkedIn, YouTube) — glyphes SVG écrits à la main à la place.
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 512" fill="currentColor" className={className} aria-hidden>
      <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" className={className} aria-hidden>
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" className={className} aria-hidden>
      <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 576 512" fill="currentColor" className={className} aria-hidden>
      <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" />
    </svg>
  );
}

interface SiteConfigPublic {
  socialLinks: { facebook?: string; twitter?: string; linkedin?: string; youtube?: string };
  logoKey?: string | null;
}

export function Footer() {
  const t = useTranslations("footer");
  const { data: config } = useApiOne<SiteConfigPublic>("/site-config");
  const reseaux = [
    { icon: FacebookIcon, label: "Facebook", href: config?.socialLinks?.facebook || "#" },
    { icon: XIcon, label: "X (Twitter)", href: config?.socialLinks?.twitter || "#" },
    { icon: LinkedinIcon, label: "LinkedIn", href: config?.socialLinks?.linkedin || "#" },
    { icon: YoutubeIcon, label: "YouTube", href: config?.socialLinks?.youtube || "#" },
  ];

  const colonnes = [
    {
      titre: t("authorityTitle"),
      liens: [
        { to: "/a-propos", label: t("missions") },
        { to: "/actualites", label: t("newsAndReleases") },
        { to: "/statistiques", label: t("observatory") },
        { to: "/carrieres", label: t("careers") },
      ],
    },
    {
      titre: t("proceduresTitle"),
      liens: [
        { to: "/services", label: t("ourServices") },
        { to: "/equipements", label: t("approvedEquipment") },
        { to: "/reclamations", label: t("fileClaim") },
        { to: "/appels-offres", label: t("tenders") },
      ],
    },
    {
      titre: t("resourcesTitle"),
      liens: [
        { to: "/reglementation", label: t("regulatoryTexts") },
        { to: "/consultations", label: t("publicConsultations") },
        { to: "/contact", label: t("writeToUs") },
        { to: "/portail", label: t("userPortal") },
      ],
    },
  ] as const;

  return (
    <footer className="mt-auto bg-institution text-primary-foreground">
      <div className="container-content grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          {config?.logoKey ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo provenant de MinIO (hôte dynamique, non listable dans next.config.js images.domains)
            <img src={config.logoKey} alt="ARPT" className="h-14 w-auto" />
          ) : (
            <Image src="/images/arpt.png" alt="ARPT" width={140} height={56} className="h-14 w-auto" style={{ width: "auto" }} />
          )}
          <p className="mt-4 text-sm leading-relaxed opacity-85">{t("description")}</p>
          <div className="mt-5 flex gap-2">
            {reseaux.map((r) => (
              <a
                key={r.label}
                href={r.href}
                aria-label={r.label}
                className="grid size-9 place-items-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20"
              >
                <r.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {colonnes.map((col) => (
          <div key={col.titre}>
            <p className="font-heading text-sm font-semibold tracking-wide uppercase opacity-80">{col.titre}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.liens.map((l) => (
                <li key={l.to + l.label}>
                  {l.to === "/portail" ? <AuthTrigger className="text-left opacity-85 transition-opacity hover:opacity-100">{l.label}</AuthTrigger> : <Link href={l.to} className="opacity-85 transition-opacity hover:opacity-100">
                    {l.label}
                  </Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="container-content py-5 text-xs opacity-70">
          {t("copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
