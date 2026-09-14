"use client";

import { CalendarRange, Mail } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { StatutBadge } from "@/components/site/StatutBadge";
import { Button } from "@/components/ui/button";
import { consultations, formaterDate } from "@/data/mock";


export default function Consultations() {
  return (
    <>
      <PageHero
        surtitre="Participation"
        titre="Consultations publiques"
        description="Avant l'adoption d'un texte structurant, l'Autorité recueille les observations des opérateurs, des associations de consommateurs et du public."
      />

      <section className="section-y">
        <div className="container-content grid gap-x-16 gap-y-12 lg:grid-cols-2">
          {consultations.map((c) => (
            <article key={c.id} className="flex flex-col border-t border-border pt-7">
              <StatutBadge statut={c.statut} className="self-start" />
              <h2 className="mt-4 font-heading text-xl font-semibold">{c.titre}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
              <p className="mt-5 flex items-center gap-2 text-sm">
                <CalendarRange className="size-4 shrink-0 text-primary" aria-hidden />
                Du {formaterDate(c.debut)} au {formaterDate(c.fin)}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" aria-hidden />
                {c.email}
              </p>
              <Button className="mt-6 self-start" disabled={c.statut === "CLOTUREE"}>
                {c.statut === "CLOTUREE" ? "Consultation clôturée" : "Transmettre une contribution"}
              </Button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

