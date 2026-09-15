"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { formaterDate, offresEmploi } from "@/data/mock";

export default function Carrieres() {
  return (
    <>
      <PageHero
        surtitre="Rejoindre l'Autorité"
        titre="Carrières à l'ARPT"
        description="L'Autorité recrute des profils techniques, juridiques et économiques engagés au service du secteur numérique guinéen."
      />

      <section className="section-y">
        <div className="container-content grid gap-6">
          {offresEmploi.map((o) => (
            <article
              key={o.id}
              className="grid gap-6 border-b border-border py-8 first:pt-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {o.code}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {o.contrat}
                  </span>
                  {o.nouveau && (
                    <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold-foreground">
                      Nouveau
                    </span>
                  )}
                </div>
                <h2 className="mt-3 font-heading text-xl font-semibold">
                  {o.intitule}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {o.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4" aria-hidden /> {o.departement}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden /> {o.lieu}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden /> Clôture :{" "}
                    {formaterDate(o.limite)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden /> {o.candidats}{" "}
                    candidatures
                  </span>
                </div>
              </div>

              <Link
                href={`/carrieres/${o.id}`}
                className="inline-flex items-center gap-2 self-start rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 lg:self-center"
              >
                Voir l'offre <ArrowRight className="size-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
