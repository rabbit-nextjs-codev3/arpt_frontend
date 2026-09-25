"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronDown,
  Coins,
  Download,
  FileText,
  Search,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthTrigger } from "@/components/site/AuthModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATUTS = ["Tous", "Ouvert", "Clôturé"] as const;

function AppelOffreCard({
  appel,
  onSubmitted,
  ouvertParDefaut = false,
}: {
  appel: TendersCall;
  onSubmitted: () => void;
  ouvertParDefaut?: boolean;
}) {
  const t = useTranslations("tendersPage");
  const { user, loading: authLoading } = useAuth();
  const [ouvert, setOuvert] = useState(ouvertParDefaut);
  const [formulaire, setFormulaire] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!user) return;
    const data = new FormData(form);
    setEnvoi(true);
    try {
      await apiFetch(`/tenders/${appel.id}/submissions`, {
        method: "POST",
        body: JSON.stringify({
          experience: { fr: String(data.get("experience") ?? "").trim() },
          proposition: { fr: String(data.get("proposition") ?? "").trim() },
        }),
      });
      setEnvoye(true);
      toast.success(t("submissionSuccess"));
      onSubmitted();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t("submissionError"),
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <article
      id={`appel-offre-${appel.uid}`}
      className="grid gap-8 border-b border-border py-8 first:pt-0 lg:grid-cols-[minmax(0,1fr)_16rem]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-semibold text-primary">
            {appel.code}
          </span>
          <StatutBadge statut={appel.status} />
          {appel.isNew && (
            <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold-foreground">
              {t("new")}
            </span>
          )}
        </div>
        <h2 className="mt-3 font-heading text-xl font-semibold">
          {appel.name}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("categoryLabel", { category: appel.category.name })}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {appel.description}
        </p>
        <button
          type="button"
          onClick={() => setOuvert(!ouvert)}
          aria-expanded={ouvert}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {ouvert ? t("viewLess") : t("viewMore")}
          <ChevronDown
            className={`size-4 transition-transform ${ouvert ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {ouvert && (
          <div className="mt-4 space-y-4 rounded-lg border border-border bg-surface p-4">
            {appel.fileUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-md border border-border bg-white">
                  {appel.fileUrl
                    .toLowerCase()
                    .split("?")[0]
                    .endsWith(".pdf") ? (
                    <iframe
                      src={`${appel.fileUrl}#toolbar=1`}
                      title={t("documentPreview")}
                      className="h-[28rem] w-full"
                    />
                  ) : (
                    <p className="p-5 text-sm text-muted-foreground">
                      {t("previewUnavailable")}
                    </p>
                  )}
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={appel.fileUrl} download>
                    <Download className="size-4" aria-hidden />{" "}
                    {t("downloadDocument")}
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noFile")}</p>
            )}
            {appel.status === "OUVERT" &&
              appel.fileUrl &&
              !envoye &&
              (authLoading ? null : !user ? (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="mb-3">{t("loginRequired")}</p>
                  <Button asChild>
                    <AuthTrigger>{t("loginToSubmit")}</AuthTrigger>
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("accountUsed", {
                      name: user.companyName || user.fullname,
                      email: user.email,
                    })}
                  </p>
                  <Button
                    type="button"
                    onClick={() => setFormulaire(!formulaire)}
                  >
                    {t("submitOffer")}
                  </Button>
                  {formulaire && (
                    <form onSubmit={soumettre} className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="submission-experience">
                          {t("experience")}
                        </Label>
                        <Textarea
                          id="submission-experience"
                          name="experience"
                          required
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="submission-proposal">
                          {t("proposal")}
                        </Label>
                        <Textarea
                          id="submission-proposal"
                          name="proposition"
                          required
                          rows={5}
                        />
                      </div>
                      <Button type="submit" disabled={envoi}>
                        {envoi ? t("submitting") : t("confirmSubmission")}
                      </Button>
                    </form>
                  )}
                </>
              ))}{" "}
            {envoye && (
              <p role="status" className="text-sm font-medium text-success">
                {t("submissionSuccess")}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-3 text-sm">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
          {t("publishedOn", { date: formaterDate(appel.publicationDate) })}
        </p>
        <p className="flex items-center gap-2">
          <CalendarDays
            className="size-4 shrink-0 text-destructive"
            aria-hidden
          />
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
const STATUT_KEYS: Record<(typeof STATUTS)[number], "all" | "open" | "closed"> =
  {
    Tous: "all",
    Ouvert: "open",
    Clôturé: "closed",
  };

export default function AppelsOffres() {
  const t = useTranslations("tendersPage");
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const { data: hero } = useContentBlock<HeroContent>(
    "tenders.hero",
    HERO_DEFAUT,
  );
  const {
    data: appelsOffres,
    loading,
    error,
    refetch,
  } = useApiList<TendersCall>(`/tenders?lang=${locale}&pageSize=100`);
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<(typeof STATUTS)[number]>("Tous");
  const [categorie, setCategorie] = useState("Toutes");

  const categories = useMemo(
    () => [
      "Toutes",
      ...Array.from(new Set(appelsOffres.map((a) => a.category.name))),
    ],
    [appelsOffres],
  );

  const resultats = useMemo(() => {
    const q = recherche.toLowerCase();
    return appelsOffres.filter((a) => {
      const matchRecherche =
        a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q);
      const matchStatut =
        statut === "Tous" ||
        (statut === "Ouvert" && a.status === "OUVERT") ||
        (statut === "Clôturé" && a.status === "CLOTURE");
      const matchCategorie =
        categorie === "Toutes" || a.category.name === categorie;
      return (
        (!uid || a.uid === uid) &&
        matchRecherche &&
        matchStatut &&
        matchCategorie
      );
    });
  }, [appelsOffres, recherche, statut, categorie, uid]);

  const ouverts = appelsOffres.filter((a) => a.status === "OUVERT").length;

  return (
    <>
      <PageHero
        surtitre={hero.surtitre}
        titre={hero.titre}
        description={hero.description}
      >
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
              <Search
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
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
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {t("statutLabel")}
                </span>
                <Select
                  value={statut}
                  onValueChange={(v) =>
                    setStatut(v as (typeof STATUTS)[number])
                  }
                >
                  <SelectTrigger
                    className="w-40"
                    aria-label={t("statutFilterAriaLabel")}
                  >
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
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {t("categoryFilterLabel")}
                </span>
                <Select value={categorie} onValueChange={setCategorie}>
                  <SelectTrigger
                    className="w-48"
                    aria-label={t("categoryFilterAriaLabel")}
                  >
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

          {loading && (
            <Loader
              className="mt-6 flex justify-center py-8"
              label={t("loading")}
            />
          )}
          {error && !loading && (
            <p className="mt-6 text-sm text-destructive">{error}</p>
          )}

          <div className="mt-6 grid gap-2">
            {resultats.map((a) => (
              <AppelOffreCard
                key={a.uid}
                appel={a}
                onSubmitted={refetch}
                ouvertParDefaut={a.uid === uid}
              />
            ))}
            {!loading && !error && resultats.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("empty")}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
