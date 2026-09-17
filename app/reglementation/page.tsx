"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formaterDate } from "@/data/mock";
import { api, ApiError, type PaginatedResult } from "@/lib/api";

interface Reglementation {
  id: number;
  uid: string;
  name: string;
  description: string;
  category: string;
  format: string;
  isPopular: boolean;
  dateUpload: string;
  views: number;
  fileUrl: string;
}

export default function Reglementation() {
  const [categorie, setCategorie] = useState("Toutes");
  const [recherche, setRecherche] = useState("");
  const [textes, setTextes] = useState<Reglementation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    api
      .get<PaginatedResult<Reglementation>>("/regulations?lang=fr&pageSize=100")
      .then((res) => {
        if (!annule) setTextes(res.results);
      })
      .catch((err: unknown) => {
        if (!annule) setErreur(err instanceof ApiError ? err.message : "Impossible de charger les textes.");
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, []);

  const categories = useMemo(
    () => ["Toutes", ...Array.from(new Set(textes.map((t) => t.category)))],
    [textes],
  );

  const resultats = useMemo(
    () =>
      textes.filter(
        (r) =>
          (categorie === "Toutes" || r.category === categorie) &&
          r.name.toLowerCase().includes(recherche.toLowerCase()),
      ),
    [textes, categorie, recherche],
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
            {chargement && (
              <p className="p-8 text-center text-sm text-muted-foreground">Chargement des textes…</p>
            )}
            {erreur && !chargement && (
              <p className="p-8 text-center text-sm text-destructive">{erreur}</p>
            )}
            {!chargement && !erreur && (
              <ul className="divide-y divide-border">
                {resultats.map((r) => (
                  <li key={r.uid} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="font-medium">{r.name}</p>
                      {r.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.description}</p>
                      )}
                      <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
                          {r.category}
                        </span>
                        <span>{formaterDate(r.dateUpload)}</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3.5" aria-hidden /> {r.views.toLocaleString("fr-FR")} vues
                        </span>
                        <span>{r.format}</span>
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="justify-self-start sm:justify-self-end">
                      <Link href={`/reglementation/${r.uid}`}>
                        Voir plus <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  </li>
                ))}
                {resultats.length === 0 && (
                  <li className="p-8 text-center text-sm text-muted-foreground">Aucun texte ne correspond à votre recherche.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
