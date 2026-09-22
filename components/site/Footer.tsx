
"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthTrigger } from "@/components/site/AuthModal";
import { useApiOne } from "@/lib/hooks";

// ======================================================
// ICÔNES DES RÉSEAUX SOCIAUX
// ======================================================

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 512"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 448 512"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 576 512"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" />
    </svg>
  );
}

// ======================================================
// INTERFACE
// ======================================================

interface SiteConfigPublic {
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };

  logoKey?: string | null;
}

// ======================================================
// FOOTER
// ======================================================

export function Footer() {
  const t = useTranslations("footer");

  const { data: config } =
    useApiOne<SiteConfigPublic>("/site-config");

  const reseaux = [
    {
      icon: FacebookIcon,
      label: "Facebook",
      href: config?.socialLinks?.facebook || "#",
    },
    {
      icon: XIcon,
      label: "X (Twitter)",
      href: config?.socialLinks?.twitter || "#",
    },
    {
      icon: LinkedinIcon,
      label: "LinkedIn",
      href: config?.socialLinks?.linkedin || "#",
    },
    {
      icon: YoutubeIcon,
      label: "YouTube",
      href: config?.socialLinks?.youtube || "#",
    },
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

      {/* ==================================================
          CONTENU PRINCIPAL
          ================================================== */}

      <div
        className="
          container-content
          grid
          grid-cols-1
          items-start
          gap-x-10
          gap-y-12
          py-14
          md:grid-cols-2
          lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))]
          xl:gap-x-12
        "
      >

        {/* ==================================================
            PREMIÈRE COLONNE : LOGO ET DESCRIPTION
            ================================================== */}

        <div className="flex min-w-0 flex-col items-start">

          {/* LOGO */}

          <div
            className="
              flex
              h-24
              w-44
              max-w-full
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-xl
              bg-white
              p-3
              shadow-md
            "
          >
            {config?.logoKey ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo provenant de MinIO
              <img
                src={config.logoKey}
                alt="ARPT"
                className="
                  block
                  h-full
                  w-full
                  object-contain
                  object-center
                "
                loading="lazy"
              />
            ) : (
              <Image
                src="/images/logo33.jpeg"
                alt="ARPT"
                width={152}
                height={72}
                className="
                  h-full
                  w-full
                  object-contain
                  object-center
                "
              />
            )}
          </div>

          {/* DESCRIPTION */}

          <p
            className="
              mt-6
              max-w-[38ch]
              text-sm
              font-normal
              leading-7
              text-primary-foreground/85
            "
          >
            {t("description")}
          </p>

          {/* RÉSEAUX SOCIAUX */}

          <div
            className="
              mt-6
              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            {reseaux.map((r) => (
              <a
                key={r.label}
                href={r.href}
                aria-label={r.label}
                className="
                  grid
                  size-9
                  shrink-0
                  place-items-center
                  rounded-full
                  bg-teal-600
                  text-white
                  shadow
                  transition-colors
                  hover:bg-teal-700
                "
              >
                <r.icon className="size-4" />
              </a>
            ))}
          </div>

        </div>

        {/* ==================================================
            COLONNES : AUTORITÉ / DÉMARCHES / RESSOURCES
            ================================================== */}

        {colonnes.map((col) => (
          <div
            key={col.titre}
            className="
              flex
              min-w-0
              flex-col
              items-start
            "
          >

            {/* TITRE */}

            <p
              className="
                mb-6
                text-sm
                font-semibold
                leading-6
                tracking-wide
                uppercase
                opacity-80
                font-heading
              "
            >
              {col.titre}
            </p>

            {/* LIENS */}

            <ul
              className="
                flex
                w-full
                flex-col
                items-start
                gap-3
                text-sm
                leading-6
              "
            >
              {col.liens.map((l) => (
                <li
                  key={l.to + l.label}
                  className="w-full"
                >
                  {l.to === "/portail" ? (
                    <AuthTrigger
                      className="
                        text-left
                        opacity-85
                        transition-opacity
                        hover:opacity-100
                      "
                    >
                      {l.label}
                    </AuthTrigger>
                  ) : (
                    <Link
                      href={l.to}
                      className="
                        inline-block
                        text-left
                        opacity-85
                        transition-opacity
                        hover:opacity-100
                      "
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

          </div>
        ))}

      </div>

      {/* ==================================================
          COPYRIGHT
          ================================================== */}

      <div className="border-t border-primary-foreground/15">
        <div className="container-content py-5 text-xs opacity-70">
          {t("copyright", { year: new Date().getFullYear() })}
        </div>
      </div>

    </footer>
  );
}