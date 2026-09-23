"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Eye, LibraryBig, Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formaterDate } from "@/data/mock";
import { api, ApiError, type PaginatedResult } from "@/lib/api";
import { useContentBlock } from "@/lib/hooks";
import { useLocale } from "@/lib/locale-context";

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "Ressources",
  titre: "Cadre réglementaire du secteur",
  description:
    "Consultez et téléchargez l'ensemble des textes en vigueur applicables aux postes et aux télécommunications.",
};

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
  const t = useTranslations("regulationPage");
  const { locale } = useLocale();
  const { data: hero } = useContentBlock<HeroContent>("regulation.hero", HERO_DEFAUT);
  const [categorie, setCategorie] = useState("Toutes");
  const [recherche, setRecherche] = useState("");
  const [textes, setTextes] = useState<Reglementation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    queueMicrotask(() => {
      if (!annule) setChargement(true);
    });
    api
      .get<PaginatedResult<Reglementation>>(`/regulations?lang=${locale}&pageSize=100`)
      .then((res) => {
        if (!annule) setTextes(res.results);
      })
      .catch((err: unknown) => {
        if (!annule) setErreur(err instanceof ApiError ? err.message : t("loadError"));
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const categories = useMemo(
    () => ["Toutes", ...Array.from(new Set(textes.map((r) => r.category)))],
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
      <PageHero surtitre={hero.surtitre} titre={hero.titre} description={hero.description} />

      <section className="section-y bg-surface-fade">
        <div className="container-content">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700"><LibraryBig className="size-5" aria-hidden /></span><div><h2 className="font-heading text-lg font-semibold">Bibliothèque réglementaire</h2><p className="mt-1 text-sm text-muted-foreground">{resultats.length} texte{resultats.length > 1 ? "s" : ""} disponible{resultats.length > 1 ? "s" : ""}</p></div></div>
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
                aria-label={t("searchAriaLabel")}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
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
                {c === "Toutes" ? t("allCategories") : c}
              </button>
            ))}
          </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {chargement && (
              <p className="p-8 text-center text-sm text-muted-foreground">{t("loading")}</p>
            )}
            {erreur && !chargement && (
              <p className="p-8 text-center text-sm text-destructive">{erreur}</p>
            )}
            {!chargement && !erreur && (
              <ul className="divide-y divide-border">
                {resultats.map((r) => (
                  <li key={r.uid} className="grid gap-4 p-5 transition-colors hover:translate-x-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
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
                          <Eye className="size-3.5" aria-hidden /> {t("views", { count: r.views.toLocaleString(locale) })}
                        </span>
                        <span>{r.format}</span>
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm"
                     className="justify-self-start sm:justify-self-end">
                      <Link href={`/reglementation/${r.uid}`}>
                        {t("viewMore")} <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  </li>
                ))}
                {resultats.length === 0 && (
                  <li className="p-8 text-center text-sm text-muted-foreground">{t("noResults")}</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
