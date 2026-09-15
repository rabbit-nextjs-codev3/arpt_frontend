"use client";

import { CalendarDays, Coins, Users, Download } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { StatutBadge } from "@/components/site/StatutBadge";
import { appelsOffres, formaterDate } from "@/data/mock";

export default function AppelsOffres() {
  return (
    <>
      <PageHero
        surtitre="Marchés publics"
        titre="Appels d'offres de l'Autorité"
        description="Les avis publiés ci-dessous précisent l'objet du marché, le budget prévisionnel et la date limite de dépôt des plis."
      />

      <section className="section-y">
        <div className="container-content grid gap-6">
          {appelsOffres.map((a) => (
            <article
              key={a.id}
              className="grid gap-8 border-b border-border py-8 first:pt-0 lg:grid-cols-[minmax(0,1fr)_16rem]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {a.code}
                  </span>
                  <StatutBadge statut={a.statut} />
                  {a.nouveau && (
                    <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold-foreground">
                      Nouveau
                    </span>
                  )}
                </div>
                <h2 className="mt-3 font-heading text-xl font-semibold">
                  {a.nom}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Catégorie : {a.categorie}
                </p>
              </div>

              <div className="grid gap-3 text-sm">
                <p className="flex items-center gap-2">
                  <CalendarDays
                    className="size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  Publié le {formaterDate(a.publication)}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays
                    className="size-4 shrink-0 text-destructive"
                    aria-hidden
                  />
                  Limite : {formaterDate(a.limite)}
                </p>
                <p className="flex items-center gap-2">
                  <Coins className="size-4 shrink-0 text-primary" aria-hidden />
                  {a.budget}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4 shrink-0" aria-hidden />
                  {a.soumissions} soumission{a.soumissions > 1 ? "s" : ""}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 justify-self-start"
                >
                  <Download className="size-4" aria-hidden /> Dossier d'appel
                  d'offres
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
