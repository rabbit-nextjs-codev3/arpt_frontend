"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Radio,
  Gavel,
  Briefcase,
  MessageSquareWarning,
  MessageSquare,
  BarChart3,
  Download,
  CalendarDays,
  Megaphone,
  Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionTitle } from "@/components/site/PageHero";
import { StatutBadge } from "@/components/site/StatutBadge";
import { formaterDate } from "@/data/mock";
import { useApiList, useApiOne, useContentBlock } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface News {
  id: number;
  uid: string;
  title: string;
  content: string;
  category: string | null;
  createdAt: string;
  imageUrl: string | null;
}

interface Communique {
  id: number;
  uid: string;
  title: string;
  createdAt: string;
}

interface Reglementation {
  id: number;
  uid: string;
  name: string;
  isPopular: boolean;
}

interface TendersCall {
  id: number;
  uid: string;
  code: string;
  name: string;
  status: "OUVERT" | "CLOTURE" | "ANNULE";
  limitDate: string;
}

interface PublicConsultation {
  id: number;
  uid: string;
  title: string;
  status: "OUVERTE" | "CLOTUREE";
  startDate: string;
  endDate: string;
}

interface Service {
  id: number;
  uid: string;
  name: string;
  description: string;
  delai: string;
}

interface SectorOverview {
  kpis: {
    subscribersMillion: number | null;
    penetrationRate: number | null;
    internetSubscribersMillion: number | null;
    internetPenetrationRate: number | null;
    mobileMoneyPenetrationRate: number | null;
    salariedJobs: number | null;
  } | null;
}

interface ChiffreCle {
  label: string;
  valeur: number | null;
  decimales: number;
  suffixe: string;
}

function formaterChiffresCles(kpis: SectorOverview["kpis"]): ChiffreCle[] {
  if (!kpis) return [];
  return [
    { label: "Abonnements mobile", valeur: kpis.subscribersMillion, decimales: 1, suffixe: " M" },
    { label: "Abonnements internet", valeur: kpis.internetSubscribersMillion, decimales: 1, suffixe: " M" },
    { label: "Emplois salariés", valeur: kpis.salariedJobs, decimales: 0, suffixe: "" },
    { label: "Pénétration mobile", valeur: kpis.penetrationRate, decimales: 0, suffixe: " %" },
    { label: "Pénétration mobile money", valeur: kpis.mobileMoneyPenetrationRate, decimales: 0, suffixe: " %" },
    { label: "Pénétration internet", valeur: kpis.internetPenetrationRate, decimales: 0, suffixe: " %" },
  ];
}

function ChiffreAnime({ valeur, decimales, suffixe }: { valeur: number | null; decimales: number; suffixe: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [demarre, setDemarre] = useState(false);
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || valeur === null) return;
    const observer = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setDemarre(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [valeur]);

  const [enAnimation, setEnAnimation] = useState(false);

  useEffect(() => {
    if (!demarre || valeur === null) return;
    const duree = 1100;
    const debut = performance.now();
    setEnAnimation(true);
    let frame: number;
    const animer = (maintenant: number) => {
      const progres = Math.min(1, (maintenant - debut) / duree);
      const facilite = 1 - Math.pow(1 - progres, 3);
      setAffiche(valeur * facilite);
      if (progres < 1) {
        frame = requestAnimationFrame(animer);
      } else {
        setEnAnimation(false);
      }
    };
    frame = requestAnimationFrame(animer);
    return () => cancelAnimationFrame(frame);
  }, [demarre, valeur]);

  return (
    <p
      ref={ref}
      className={cn(
        "font-heading text-2xl font-bold text-primary tabular-nums transition-transform duration-500 md:text-3xl",
        enAnimation ? "scale-110" : "scale-100",
      )}
    >
      {valeur === null
        ? "—"
        : `${affiche.toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}${suffixe}`}
    </p>
  );
}

function extrait(html: string, maxLength = 140): string {
  const texte = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return texte.length > maxLength ? `${texte.slice(0, maxLength).trimEnd()}…` : texte;
}

const ICONES_RACCOURCIS = {
  services: FileText,
  equipements: Radio,
  marches: Gavel,
  carrieres: Briefcase,
  reclamations: MessageSquareWarning,
  statistiques: BarChart3,
} as const;

type IconeRaccourci = keyof typeof ICONES_RACCOURCIS;

interface Raccourci {
  to: string;
  label: string;
  texte: string;
  icone: IconeRaccourci;
}

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
  image: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "République de Guinée",
  titre: "Réguler pour un secteur numérique fiable et accessible à tous",
  description:
    "L'ARPT encadre les marchés des postes et des télécommunications, protège les usagers et accompagne les opérateurs dans leurs démarches administratives.",
  image: "/images/hero-arpt.jpg",
};

const RACCOURCIS_DEFAUT: Raccourci[] = [
  { to: "/services", label: "Démarches et services", icone: "services", texte: "Licences, homologations, fréquences" },
  { to: "/equipements", label: "Équipements homologués", icone: "equipements", texte: "Vérifier un terminal agréé" },
  { to: "/appels-offres", label: "Appels d'offres", icone: "marches", texte: "Consulter les marchés en cours" },
  { to: "/carrieres", label: "Carrières", icone: "carrieres", texte: "Rejoindre l'Autorité" },
  { to: "/reclamations", label: "Réclamations", icone: "reclamations", texte: "Signaler un litige opérateur" },
  { to: "/statistiques", label: "Observatoire", icone: "statistiques", texte: "Chiffres clés du secteur" },
];

interface GalerieItem {
  image: string;
  categorie: string;
  titre: string;
}

const GALERIE_DEFAUT: GalerieItem[] = [
  { image: "/images/hero-arpt.jpg", categorie: "Événements", titre: "Participation de l'ARPT à une conférence internationale" },
  { image: "/images/group.jpeg", categorie: "Galerie", titre: "Visite officielle à l'ARPT" },
];

function SectionHeader({ icon: Icon, titre, lienVoirTout }: { icon: typeof Megaphone; titre: string; lienVoirTout?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <h3 className="truncate font-heading text-base font-semibold whitespace-nowrap">{titre}</h3>
      </div>
      {lienVoirTout && (
        <Link href={lienVoirTout} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
          Voir tout <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default function Accueil() {
  const { data: hero } = useContentBlock<HeroContent>("home.hero", HERO_DEFAUT);
  const { data: raccourcis } = useContentBlock<Raccourci[]>("home.quickLinks", RACCOURCIS_DEFAUT);
  const { data: galerie } = useContentBlock<GalerieItem[]>("home.gallery", GALERIE_DEFAUT);
  const [pageGalerie, setPageGalerie] = useState(0);
  const { data: services } = useApiList<Service>("/services?lang=fr&pageSize=6");
  const { data: actualites } = useApiList<News>("/news?lang=fr&pageSize=3");
  const { data: communiques } = useApiList<Communique>("/communiques?lang=fr&pageSize=4");
  const { data: reglementations } = useApiList<Reglementation>("/regulations?lang=fr&pageSize=50");
  const { data: appelsOffres } = useApiList<TendersCall>("/tenders?lang=fr&pageSize=50");
  const { data: consultations } = useApiList<PublicConsultation>("/public-consultations?lang=fr&pageSize=3");
  const { data: overview } = useApiOne<SectorOverview>("/statistics/overview?lang=fr");

  const offresOuvertes = appelsOffres.filter((a) => a.status === "OUVERT");
  const textesPopulaires = reglementations.filter((r) => r.isPopular);
  const chiffresCles = formaterChiffresCles(overview?.kpis ?? null);

  const GALERIE_PAR_PAGE = 2;
  const totalPagesGalerie = Math.max(1, Math.ceil(galerie.length / GALERIE_PAR_PAGE));
  const pageGalerieSure = Math.min(pageGalerie, totalPagesGalerie - 1);
  const galerieAffichee = galerie.slice(pageGalerieSure * GALERIE_PAR_PAGE, pageGalerieSure * GALERIE_PAR_PAGE + GALERIE_PAR_PAGE);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-institution text-primary-foreground">
        <Image
          src={hero.image}
          alt="Antenne de télécommunications surplombant Conakry au crépuscule"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-institution" aria-hidden />
        <div className="relative container-content py-12 md:py-16">
          <p className="font-heading text-xs font-semibold tracking-[0.18em] uppercase opacity-85">
            {hero.surtitre}
          </p>
          <h1 className="mt-3 max-w-3xl text-balance text-3xl leading-[1.1] font-bold tracking-tight md:text-5xl">
            {hero.titre}
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed opacity-90 md:text-lg">{hero.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/services">
                Découvrir nos services <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/reclamations">Déposer une réclamation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Chiffres clés du secteur */}
      {chiffresCles.length > 0 && (
<section className="border-b border-border bg-surface">
  <div className="container-content pt-10 pb-5">
    <p className="text-center font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-[0.08em] text-primary uppercase">
      Les chiffres des secteurs régulés
    </p>

    <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-primary" />
  </div>

  <div className="container-content grid grid-cols-2 divide-y divide-border sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
    {chiffresCles.map((c, i) => (
      <div
        key={c.label}
        className={cn(
          "px-4 py-8 text-center sm:border-l sm:border-border",
          i === 0 && "sm:border-l-0",
          i % 2 === 0 && "border-r border-border sm:border-r-0",
        )}
      >
        <ChiffreAnime
          valeur={c.valeur}
          decimales={c.decimales}
          suffixe={c.suffixe}
        />

        <p className="mt-2 text-sm font-medium leading-snug text-muted-foreground">
          {c.label}
        </p>
      </div>
    ))}
  </div>
</section>
      )}

      {/* Quick access */}
      <section className="section-y bg-surface-fade">
        <div className="container-content">
          <SectionTitle
            surtitre="Accès rapide"
            titre="Que souhaitez-vous faire aujourd'hui ?"
            description="Les démarches les plus consultées par les usagers, les opérateurs et les entreprises."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {raccourcis.map((r) => {
              const Icone = ICONES_RACCOURCIS[r.icone] ?? FileText;
              return (
                <Link
                  key={r.to}
                  href={r.to}
                  className="group flex items-start gap-4 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                    <Icone className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-heading font-semibold">{r.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{r.texte}</span>
                  </span>
                  <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-y">
        <div className="container-content">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              surtitre="Nos missions au quotidien"
              titre="Services aux opérateurs et aux entreprises"
              description="Chaque service précise les pièces à fournir, le délai d'instruction et le coût applicable."
            />
            <Button asChild variant="outline">
              <Link href="/services">Tous les services</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.uid} className="border-t-2 border-primary/30 pt-5">
                <h3 className="font-heading text-lg font-semibold">{s.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                <p className="mt-4 text-xs font-medium text-primary">Délai : {s.delai}</p>
              </article>
            ))}
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun service publié pour l'instant.</p>
            )}
          </div>
        </div>
      </section>

      {/* News + official sidebar */}
      <section className="section-y bg-surface">
        <div className="container-content grid gap-x-12 gap-y-10 lg:grid-cols-[7fr_3fr]">
          {/* Ligne 1 : Dernières publications | Communiqués officiels — même rangée de grille, donc même hauteur */}
          <div>
            <SectionHeader icon={Megaphone} titre="Dernières publications" lienVoirTout="/actualites" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {actualites.map((a) => (
                  <Card key={a.uid} className="overflow-hidden py-0 shadow-sm transition-shadow hover:shadow-md">
                    <Link href={`/actualites/${a.uid}`} className="group flex h-full flex-col">
                      <div className="relative">
                        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                          {a.imageUrl && (
                            <Image
                              src={a.imageUrl}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 30vw, 100vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                        </div>
                        {a.category && (
                          <Badge variant="secondary" className="absolute -bottom-2.5 left-3 font-semibold shadow-sm">
                            {a.category}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="flex flex-1 flex-col p-4">
                        <h3 className="text-balance font-heading text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
                          {a.title}
                        </h3>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5" aria-hidden /> {formaterDate(a.createdAt)}
                          </span>
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <ArrowRight className="size-3.5" aria-hidden />
                          </span>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
                {actualites.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune actualité publiée pour l'instant.</p>
                )}
              </div>
          </div>

          <div className="flex flex-col">
            <SectionHeader icon={FileText} titre="Communiqués officiels" lienVoirTout="/actualites" />
            <Card className="mt-5 flex flex-1 flex-col">
              <CardContent className="flex-1 p-0">
                {communiques.map((c, i) => (
                  <div key={c.uid}>
                    {i > 0 && <Separator />}
                    <Link href="/actualites" className="flex items-start gap-2.5 p-4 hover:bg-accent/30">
                      <FileText className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{c.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{formaterDate(c.createdAt)}</span>
                      </span>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </div>
                ))}
                {communiques.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">Aucun communiqué pour l'instant.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ligne 2 : En images | Textes les plus consultés — même rangée de grille, donc même hauteur */}
            {galerie.length > 0 && (
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <Images className="size-4" aria-hidden />
                    </span>
                    <h3 className="font-heading text-xl font-semibold">En images</h3>
                  </div>
                  {totalPagesGalerie > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Photos précédentes"
                        disabled={pageGalerieSure === 0}
                        onClick={() => setPageGalerie((p) => Math.max(0, p - 1))}
                        className="grid size-8 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      >
                        <ChevronLeft className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Photos suivantes"
                        disabled={pageGalerieSure >= totalPagesGalerie - 1}
                        onClick={() => setPageGalerie((p) => Math.min(totalPagesGalerie - 1, p + 1))}
                        className="grid size-8 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      >
                        <ChevronRight className="size-4" aria-hidden />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {galerieAffichee.map((g, i) => (
                    <div key={i} className="group relative aspect-[16/8] overflow-hidden rounded-xl border border-border">
                      <Image
                        src={g.image}
                        alt={g.titre}
                        fill
                        sizes="(min-width: 640px) 30vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <Badge variant="secondary" className="font-semibold">
                          {g.categorie}
                        </Badge>
                        <p className="mt-2 text-balance text-sm font-semibold text-white">{g.titre}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="flex flex-col">
            <SectionHeader icon={MessageSquare} titre="Textes les plus consultés" lienVoirTout="/reglementation" />
            <ul className="mt-6 space-y-3">
              {textesPopulaires.map((r) => (
                <li key={r.uid}>
                  <Link
                    href="/reglementation"
                    className="group flex items-start gap-3 text-sm hover:text-primary"
                  >
                    <Download className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span className="group-hover:underline">{r.name}</span>
                  </Link>
                </li>
              ))}
              {textesPopulaires.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun texte mis en avant pour le moment.</p>
              )}
            </ul>
            <Button asChild className="mt-5 w-full sm:w-auto lg:mt-auto">
              <Link href="/reglementation">Consulter la réglementation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tenders + public consultations */}
      <section className="section-y">
        <div className="container-content grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-heading text-xl font-semibold">Appels d'offres en cours</h3>
              <span className="text-sm text-muted-foreground">{offresOuvertes.length} ouvert{offresOuvertes.length > 1 ? "s" : ""}</span>
            </div>
            <Card className="mt-6">
              <CardContent className="p-0">
                {offresOuvertes.map((a, i) => (
                  <div key={a.uid}>
                    {i > 0 && <Separator />}
                    <div className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary">{a.code}</p>
                        <p className="mt-1 font-medium">{a.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Clôture le {formaterDate(a.limitDate)}</p>
                      </div>
                      <StatutBadge statut={a.status} />
                    </div>
                  </div>
                ))}
                {offresOuvertes.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">Aucun appel d'offres ouvert pour l'instant.</p>
                )}
              </CardContent>
            </Card>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/appels-offres">Tous les appels d'offres</Link>
            </Button>
          </div>

          <div>
            <h3 className="font-heading text-xl font-semibold">Consultations publiques</h3>
            <Card className="mt-6">
              <CardContent className="p-0">
                {consultations.map((c, i) => (
                  <div key={c.uid}>
                    {i > 0 && <Separator />}
                    <div className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="font-medium">{c.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Du {formaterDate(c.startDate)} au {formaterDate(c.endDate)}
                        </p>
                      </div>
                      <StatutBadge statut={c.status} />
                    </div>
                  </div>
                ))}
                {consultations.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">Aucune consultation en cours.</p>
                )}
              </CardContent>
            </Card>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/consultations">Participer aux consultations</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
