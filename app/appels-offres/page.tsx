"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, ChevronDown, Coins, Download, FileText, Search, Users } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatutBadge } from "@/components/site/StatutBadge";
import { formaterDate } from "@/data/mock";
import { useApiList, useContentBlock } from "@/lib/hooks";
import { useLocale } from "@/lib/locale-context";

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "Marchés publics",
  titre: "Appels d'offres de l'Autorité",
  description:
    "Les avis publiés ci-dessous précisent l'objet du marché, le budget prévisionnel et la date limite de dépôt des plis.",
};

interface TendersCall {
  id: number;
  uid: string;
  code: string;
  name: string;
  description: string;
  status: "OUVERT" | "CLOTURE" | "ANNULE";
  isNew: boolean;
  publicationDate: string;
  limitDate: string;
  submissionCount: number;
  category: { id: number; slug: string; name: string };
  budget: string | null;
  fileUrl: string | null;
}

const STATUTS = ["Tous", "Ouvert", "Clôturé", "Annulé"] as const;

function AppelOffreCard({ appel }: { appel: TendersCall }) {
  const t = useTranslations("tendersPage");
  const [ouvert, setOuvert] = useState(false);

  return (
    <article className="grid gap-8 border-b border-border py-8 first:pt-0 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-semibold text-primary">{appel.code}</span>
          <StatutBadge statut={appel.status === "ANNULE" ? "ANNULE" : appel.status} />
          {appel.isNew && (
            <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold-foreground">
              {t("new")}
            </span>
          )}
        </div>
        <h2 className="mt-3 font-heading text-xl font-semibold">{appel.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("categoryLabel", { category: appel.category.name })}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{appel.description}</p>

        {ouvert || !appel.fileUrl ? (
          appel.fileUrl && (
            <Button asChild variant="outline" size="sm" className="mt-3 justify-self-start">
              <a href={appel.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" aria-hidden /> {t("tenderFile")}
              </a>
            </Button>
          )
        ) : (
          <button
            type="button"
            onClick={() => setOuvert(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {t("viewMore")}
            <ChevronDown className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="grid gap-3 text-sm">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
          {t("publishedOn", { date: formaterDate(appel.publicationDate) })}
        </p>
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-destructive" aria-hidden />
          {t("deadline", { date: formaterDate(appel.limitDate) })}
        </p>
        {appel.budget && (
          <p className="flex items-center gap-2">
            <Coins className="size-4 shrink-0 text-primary" aria-hidden />
            {appel.budget}
          </p>
        )}
        <p className="flex items-center gap-2 text-muted-foreground">
          <Users className="size-4 shrink-0" aria-hidden />
          {t("submissionCount", { count: appel.submissionCount })}
        </p>
      </div>
    </article>
  );
}

const STATUT_KEYS: Record<(typeof STATUTS)[number], "all" | "open" | "closed" | "cancelled"> = {
  Tous: "all",
  Ouvert: "open",
  Clôturé: "closed",
  Annulé: "cancelled",
};

export default function AppelsOffres() {
  const t = useTranslations("tendersPage");
  const { locale } = useLocale();
  const { data: hero } = useContentBlock<HeroContent>("tenders.hero", HERO_DEFAUT);
  const { data: appelsOffres, loading, error } = useApiList<TendersCall>(`/tenders?lang=${locale}&pageSize=100`);
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<(typeof STATUTS)[number]>("Tous");
  const [categorie, setCategorie] = useState("Toutes");

  const categories = useMemo(
    () => ["Toutes", ...Array.from(new Set(appelsOffres.map((a) => a.category.name)))],
    [appelsOffres],
  );

  const resultats = useMemo(() => {
    const q = recherche.toLowerCase();
    return appelsOffres.filter((a) => {
      const matchRecherche = a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q);
      const matchStatut =
        statut === "Tous" ||
        (statut === "Ouvert" && a.status === "OUVERT") ||
        (statut === "Clôturé" && a.status === "CLOTURE") ||
        (statut === "Annulé" && a.status === "ANNULE");
      const matchCategorie = categorie === "Toutes" || a.category.name === categorie;
      return matchRecherche && matchStatut && matchCategorie;
    });
  }, [appelsOffres, recherche, statut, categorie]);

  const ouverts = appelsOffres.filter((a) => a.status === "OUVERT").length;

  return (
    <>
      <PageHero surtitre={hero.surtitre} titre={hero.titre} description={hero.description}>
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm">
            <FileText className="size-4" aria-hidden />
            {t("publishedCount", { count: appelsOffres.length })}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            {t("openCount", { count: ouverts })}
          </div>
        </div>
      </PageHero>

      <section className="pt-8 pb-14 md:pt-10 md:pb-16">
        <div className="container-content">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
                aria-label={t("searchAriaLabel")}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("statutLabel")}</span>
                <Select value={statut} onValueChange={(v) => setStatut(v as (typeof STATUTS)[number])}>
                  <SelectTrigger className="w-40" aria-label={t("statutFilterAriaLabel")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`statutOptions.${STATUT_KEYS[s]}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("categoryFilterLabel")}</span>
                <Select value={categorie} onValueChange={setCategorie}>
                  <SelectTrigger className="w-48" aria-label={t("categoryFilterAriaLabel")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === "Toutes" ? t("statutOptions.allFeminine") : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading && <p className="mt-6 text-sm text-muted-foreground">{t("loading")}</p>}
          {error && !loading && <p className="mt-6 text-sm text-destructive">{error}</p>}

          <div className="mt-6 grid gap-2">
            {resultats.map((a) => (
              <AppelOffreCard key={a.uid} appel={a} />
            ))}
            {!loading && !error && resultats.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
