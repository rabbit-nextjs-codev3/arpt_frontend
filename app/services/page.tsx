"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Clock, Coins, FileCheck2, Layers } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { useApiList, useContentBlock } from "@/lib/hooks";

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "Démarches",
  titre: "Services aux opérateurs, entreprises et particuliers",
  description:
    "Pour chaque service, retrouvez les pièces exigées, le délai d'instruction et le coût applicable. Les demandes se déposent en ligne depuis le portail usager.",
};

interface Service {
  id: number;
  uid: string;
  name: string;
  description: string;
  requiredDocuments: string[];
  delai: string;
  cost: string | null;
}

export default function Services() {
  const t = useTranslations("servicesPage");
  const { data: hero } = useContentBlock<HeroContent>("services.hero", HERO_DEFAUT);
  const { data: services, loading, error } = useApiList<Service>("/services?lang=fr&pageSize=50");

  return (
    <>
      <PageHero surtitre={hero.surtitre} titre={hero.titre} description={hero.description} />

      <section className="section-y bg-surface-fade">
        <div className="container-content">
          {loading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
          {error && !loading && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700"><Layers className="size-5" aria-hidden /></span>
              <div><h2 className="font-heading text-xl font-semibold">{hero.surtitre}</h2><p className="mt-1 text-sm text-muted-foreground">{services.length} service{services.length > 1 ? "s" : ""} disponible{services.length > 1 ? "s" : ""}</p></div>
            </div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {services.map((s) => (
              <article key={s.uid} className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card sm:p-6">
                <div className="flex items-start justify-between gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700"><FileCheck2 className="size-5" aria-hidden /></span><Clock className="size-4 text-muted-foreground" aria-hidden /></div>
                <h2 className="mt-5 font-heading text-xl font-semibold transition-colors group-hover:text-primary">{s.name}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{s.description}</p>

                <dl className="mt-6 grid gap-3 rounded-xl bg-surface p-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 py-1 text-sm">
                    <Clock className="size-4 shrink-0 text-primary" aria-hidden />
                    <div><dt className="text-[11px] font-semibold text-muted-foreground uppercase">{t("delay")}</dt><dd className="mt-0.5 font-medium">{s.delai}</dd></div>
                  </div>
                  <div className="flex items-start gap-2 py-1 text-sm">
                    <Coins className="size-4 shrink-0 text-primary" aria-hidden />
                    <div><dt className="text-[11px] font-semibold text-muted-foreground uppercase">{t("cost")}</dt><dd className="mt-0.5 font-medium">{s.cost ?? t("officialSchedule")}</dd></div>
                  </div>
                </dl>

                {s.requiredDocuments.length > 0 && (
                  <>
                    <p className="mt-6 font-heading text-sm font-semibold">{t("requiredDocuments")}</p>
                    <ul className="mt-3 space-y-2 text-sm leading-5 text-muted-foreground">
                      {s.requiredDocuments.map((d) => (
                        <li key={d} className="flex items-start gap-2">
                          <FileCheck2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <Button asChild className="mt-7 self-start">
                  <Link href={`/contact?service=${s.uid}`}>{t("submitRequest")} <ArrowRight className="size-4" aria-hidden /></Link>
                </Button>
              </article>
            ))}
          </div>

          {!loading && !error && services.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
        </div>
      </section>
    </>
  );
}
