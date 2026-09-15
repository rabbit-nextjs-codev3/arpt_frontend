"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  Radio,
  Gavel,
  Briefcase,
  MessageSquareWarning,
  BarChart3,
  Download,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionTitle } from "@/components/site/PageHero";
import { StatutBadge } from "@/components/site/StatutBadge";
import {
  actualites,
  appelsOffres,
  communiques,
  consultations,
  formaterDate,
  reglementations,
  services,
} from "@/data/mock";

const raccourcis = [
  {
    to: "/services",
    label: "Démarches et services",
    icon: FileText,
    texte: "Licences, homologations, fréquences",
  },
  {
    to: "/equipements",
    label: "Équipements homologués",
    icon: Radio,
    texte: "Vérifier un terminal agréé",
  },
  {
    to: "/appels-offres",
    label: "Appels d'offres",
    icon: Gavel,
    texte: "Consulter les marchés en cours",
  },
  {
    to: "/carrieres",
    label: "Carrières",
    icon: Briefcase,
    texte: "Rejoindre l'Autorité",
  },
  {
    to: "/reclamations",
    label: "Réclamations",
    icon: MessageSquareWarning,
    texte: "Signaler un litige opérateur",
  },
  {
    to: "/statistiques",
    label: "Observatoire",
    icon: BarChart3,
    texte: "Chiffres clés du secteur",
  },
] as const;

export default function Accueil() {
  const offresOuvertes = appelsOffres.filter((a) => a.statut === "OUVERT");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-institution text-primary-foreground">
        <Image
          src="/images/hero-arpt.jpg"
          alt="Antenne de télécommunications surplombant Conakry au crépuscule"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-institution"
          aria-hidden
        />
        <div className="relative container-content py-20 md:py-28">
          <p className="font-heading text-xs font-semibold tracking-[0.18em] uppercase opacity-85">
            République de Guinée
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl leading-[1.08] font-bold tracking-tight md:text-6xl">
            Réguler pour un secteur numérique fiable et accessible à tous
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed opacity-90">
            L'ARPT encadre les marchés des postes et des télécommunications,
            protège les usagers et accompagne les opérateurs dans leurs
            démarches administratives.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/services">
                Découvrir nos services{" "}
                <ArrowRight className="size-4" aria-hidden />
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

      {/* Quick access */}
      <section className="section-y bg-surface-fade">
        <div className="container-content">
          <SectionTitle
            surtitre="Accès rapide"
            titre="Que souhaitez-vous faire aujourd'hui ?"
            description="Les démarches les plus consultées par les usagers, les opérateurs et les entreprises."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {raccourcis.map((r) => (
              <Link
                key={r.to}
                href={r.to}
                className="group flex items-start gap-4 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                  <r.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-heading font-semibold">
                    {r.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {r.texte}
                  </span>
                </span>
                <ArrowUpRight
                  className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            ))}
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
            {services.slice(0, 6).map((s) => (
              <article key={s.id} className="border-t-2 border-primary/30 pt-5">
                <h3 className="font-heading text-lg font-semibold">{s.nom}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
                <p className="mt-4 text-xs font-medium text-primary">
                  Délai : {s.delai}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* News + official sidebar */}
      <section className="section-y bg-surface">
        <div className="container-content grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionTitle
                surtitre="Actualités"
                titre="Dernières publications"
              />
              <Button asChild variant="ghost">
                <Link href="/actualites">
                  Voir tout <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {actualites.slice(0, 4).map((a) => (
                <Card key={a.id} className="overflow-hidden py-0">
                  <Link
                    href={`/actualites/${a.id}`}
                    className="group flex h-full flex-col"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      <Image
                        src={a.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="font-semibold">
                          {a.categorie}
                        </Badge>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden />{" "}
                          {formaterDate(a.date)}
                        </span>
                      </div>
                      <h3 className="mt-3 text-balance font-heading text-base font-semibold leading-snug transition-colors group-hover:text-primary">
                        {a.titre}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {a.extrait}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>

          <aside className="space-y-10">
            <div>
              <h3 className="font-heading font-semibold">
                Communiqués officiels
              </h3>
              <Card className="mt-5">
                <CardContent className="p-0">
                  {communiques.map((c, i) => (
                    <div key={c.id}>
                      {i > 0 && <Separator />}
                      <Link
                        href="/actualites"
                        className="flex items-start gap-2.5 p-4 hover:bg-accent/30"
                      >
                        <FileText
                          className="mt-0.5 size-4 shrink-0 text-gold"
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {c.titre}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {formaterDate(c.date)}
                          </span>
                        </span>
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="font-heading font-semibold">
                Textes les plus consultés
              </h3>
              <ul className="mt-5 space-y-3">
                {reglementations
                  .filter((r) => r.populaire)
                  .map((r) => (
                    <li key={r.id}>
                      <Link
                        href="/reglementation"
                        className="group flex items-start gap-3 text-sm hover:text-primary"
                      >
                        <Download
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden
                        />
                        <span className="group-hover:underline">{r.nom}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
              <Button asChild variant="outline" size="sm" className="mt-5">
                <Link href="/reglementation">Consulter la réglementation</Link>
              </Button>
            </div>
          </aside>
        </div>
      </section>

      {/* Tenders + public consultations */}
      <section className="section-y">
        <div className="container-content grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-heading text-xl font-semibold">
                Appels d'offres en cours
              </h3>
              <span className="text-sm text-muted-foreground">
                {offresOuvertes.length} ouvert
                {offresOuvertes.length > 1 ? "s" : ""}
              </span>
            </div>
            <Card className="mt-6">
              <CardContent className="p-0">
                {offresOuvertes.map((a, i) => (
                  <div key={a.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary">
                          {a.code}
                        </p>
                        <p className="mt-1 font-medium">{a.nom}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Clôture le {formaterDate(a.limite)}
                        </p>
                      </div>
                      <StatutBadge statut={a.statut} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/appels-offres">Tous les appels d'offres</Link>
            </Button>
          </div>

          <div>
            <h3 className="font-heading text-xl font-semibold">
              Consultations publiques
            </h3>
            <Card className="mt-6">
              <CardContent className="p-0">
                {consultations.slice(0, 3).map((c, i) => (
                  <div key={c.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="font-medium">{c.titre}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Du {formaterDate(c.debut)} au {formaterDate(c.fin)}
                        </p>
                      </div>
                      <StatutBadge statut={c.statut} />
                    </div>
                  </div>
                ))}
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
