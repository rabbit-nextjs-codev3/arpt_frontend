"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, MapPin, Search, Users } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formaterDate } from "@/data/mock";
import { useApiList } from "@/lib/hooks";

interface Career {
  id: number;
  uid: string;
  code: string;
  name: string;
  description: string;
  publicationDate: string;
  limitDate: string;
  departement: string;
  location: string | null;
  isNew: boolean;
  candidatCount: number;
  category: { id: number; slug: string; name: string };
}

export default function Carrieres() {
  const { data: offresEmploi, loading, error } = useApiList<Career>("/careers?lang=fr&pageSize=100");
  const [recherche, setRecherche] = useState("");
  const [departement, setDepartement] = useState("Tous");

  const departements = useMemo(
    () => ["Tous", ...Array.from(new Set(offresEmploi.map((o) => o.departement)))],
    [offresEmploi],
  );

  const resultats = useMemo(() => {
    const q = recherche.toLowerCase();
    return offresEmploi.filter((o) => {
      const matchRecherche =
        o.name.toLowerCase().includes(q) || o.departement.toLowerCase().includes(q);
      const matchDepartement = departement === "Tous" || o.departement === departement;
      return matchRecherche && matchDepartement;
    });
  }, [offresEmploi, recherche, departement]);

  return (
    <>
      <PageHero
        surtitre="Rejoindre l'Autorité"
        titre="Carrières à l'ARPT"
        description="L'Autorité recrute des profils techniques, juridiques et économiques engagés au service du secteur numérique guinéen."
      />

      <section className="pt-8 pb-14 md:pt-10 md:pb-16">
        <div className="container-content">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une offre…"
                className="pl-9"
                aria-label="Rechercher une offre d'emploi"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Département</span>
              {departements.map((d) => (
                <button
                  key={d}
                  onClick={() => setDepartement(d)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    departement === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>}
          {error && !loading && <p className="mt-6 text-sm text-destructive">{error}</p>}

          <div className="mt-6 grid gap-6">
            {resultats.map((o) => (
              <article
                key={o.uid}
                className="grid gap-6 border-b border-border py-8 first:pt-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-primary">{o.code}</span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {o.category.name}
                    </span>
                    {o.isNew && (
                      <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold-foreground">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-heading text-xl font-semibold">{o.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.description}</p>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-4" aria-hidden /> {o.departement}
                    </span>
                    {o.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-4" aria-hidden /> {o.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" aria-hidden /> Clôture : {formaterDate(o.limitDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4" aria-hidden /> {o.candidatCount} candidatures
                    </span>
                  </div>
                </div>

                <Link
                  href={`/carrieres/${o.uid}`}
                  className="inline-flex items-center gap-2 self-start rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 lg:self-center"
                >
                  Voir l'offre <ArrowRight className="size-4" aria-hidden />
                </Link>
              </article>
            ))}
            {!loading && !error && resultats.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucune offre ne correspond à votre recherche.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
