"use client";

import { useTranslations } from "next-intl";
import { CalendarRange, Download, Mail, MessageSquare, UsersRound } from "lucide-react";
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

      <section className="section-y bg-surface-fade">
        <div className="container-content">
          {loading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
          {error && !loading && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><UsersRound className="size-5" aria-hidden /></span><div><h2 className="font-heading text-xl font-semibold">Participation citoyenne</h2><p className="mt-1 text-sm text-muted-foreground">{consultations.length} consultation{consultations.length > 1 ? "s" : ""} publiée{consultations.length > 1 ? "s" : ""}</p></div></div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {consultations.map((c) => (
              <article key={c.uid} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card sm:p-6">
                <div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent text-primary"><MessageSquare className="size-5" aria-hidden /></span><StatutBadge statut={c.status} /></div>
                <h2 className="mt-5 font-heading text-xl font-semibold">{c.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{c.description}</p>
                <div className="mt-5 rounded-xl bg-surface p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <CalendarRange className="size-4 shrink-0 text-primary" aria-hidden />
                  {t("dateRange", { start: formaterDate(c.startDate), end: formaterDate(c.endDate) })}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4 shrink-0" aria-hidden />
                  {c.contactEmail}
                </p>
                </div>
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
