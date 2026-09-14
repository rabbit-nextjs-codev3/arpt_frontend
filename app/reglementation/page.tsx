"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formaterDate, reglementations } from "@/data/mock";


const categories = ["Toutes", "Loi", "Décret", "Arrêté", "Décision", "Directive"];

export default function Reglementation() {
  const [categorie, setCategorie] = useState("Toutes");
  const [recherche, setRecherche] = useState("");

  const resultats = useMemo(
    () =>
      reglementations.filter(
        (r) =>
          (categorie === "Toutes" || r.categorie === categorie) &&
          r.nom.toLowerCase().includes(recherche.toLowerCase()),
      ),
    [categorie, recherche],
  );

  return (
    <>
      <PageHero
        surtitre="Ressources"
        titre="Cadre réglementaire du secteur"
        description="Consultez et téléchargez l'ensemble des textes en vigueur applicables aux postes et aux télécommunications."
      />

      <section className="section-y">
        <div className="container-content">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un texte…"
                className="pl-9"
                aria-label="Rechercher un texte réglementaire"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategorie(c)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    categorie === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 border-y border-border">
            <ul className="divide-y divide-border">
              {resultats.map((r) => (
                <li key={r.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">{r.nom}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
                        {r.categorie}
                      </span>
                      <span>{formaterDate(r.date)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" aria-hidden /> {r.vues.toLocaleString("fr-FR")} vues
                      </span>
                      <span>{r.format}</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="justify-self-start sm:justify-self-end">
                    <Download className="size-4" aria-hidden /> Télécharger
                  </Button>
                </li>
              ))}
              {resultats.length === 0 && (
                <li className="p-8 text-center text-sm text-muted-foreground">Aucun texte ne correspond à votre recherche.</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

