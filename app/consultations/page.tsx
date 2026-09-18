"use client";

import { useTranslations } from "next-intl";
import { CalendarRange, Download, Mail } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { StatutBadge } from "@/components/site/StatutBadge";
import { Button } from "@/components/ui/button";
import { formaterDate } from "@/data/mock";
import { useApiList, useContentBlock } from "@/lib/hooks";
import { useLocale } from "@/lib/locale-context";

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "Participation",
  titre: "Consultations publiques",
  description:
    "Avant l'adoption d'un texte structurant, l'Autorité recueille les observations des opérateurs, des associations de consommateurs et du public.",
};

interface PublicConsultation {
  id: number;
  uid: string;
  title: string;
  description: string;
  status: "OUVERTE" | "CLOTUREE";
  startDate: string;
  endDate: string;
  contactEmail: string;
  fileUrl: string | null;
}

export default function Consultations() {
  const t = useTranslations("consultationsPage");
  const { locale } = useLocale();
  const { data: hero } = useContentBlock<HeroContent>("consultations.hero", HERO_DEFAUT);
  const { data: consultations, loading, error } = useApiList<PublicConsultation>(
    `/public-consultations?lang=${locale}&pageSize=50`,
  );

  return (
    <>
      <PageHero surtitre={hero.surtitre} titre={hero.titre} description={hero.description} />

      <section className="section-y">
        <div className="container-content">
          {loading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
          {error && !loading && <p className="text-sm text-destructive">{error}</p>}

          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
            {consultations.map((c) => (
              <article key={c.uid} className="flex flex-col border-t border-border pt-7">
                <StatutBadge statut={c.status} className="self-start" />
                <h2 className="mt-4 font-heading text-xl font-semibold">{c.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                <p className="mt-5 flex items-center gap-2 text-sm">
                  <CalendarRange className="size-4 shrink-0 text-primary" aria-hidden />
                  {t("dateRange", { start: formaterDate(c.startDate), end: formaterDate(c.endDate) })}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4 shrink-0" aria-hidden />
                  {c.contactEmail}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button asChild disabled={c.status === "CLOTUREE"}>
                    <a href={c.status === "CLOTUREE" ? undefined : `mailto:${c.contactEmail}`}>
                      {c.status === "CLOTUREE" ? t("closed") : t("submitContribution")}
                    </a>
                  </Button>
                  {c.fileUrl && (
                    <Button asChild variant="outline">
                      <a href={c.fileUrl} target="_blank" rel="noreferrer">
                        <Download className="size-4" aria-hidden /> {t("downloadDocument")}
                      </a>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>

          {!loading && !error && consultations.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
        </div>
      </section>
    </>
  );
}
