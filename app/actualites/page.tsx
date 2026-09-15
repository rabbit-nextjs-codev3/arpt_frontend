"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Eye, FileText } from "lucide-react";
import { PageHero, SectionTitle } from "@/components/site/PageHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { actualites, communiques, formaterDate } from "@/data/mock";

export default function Actualites() {
  const [featured, ...reste] = actualites;

  return (
    <>
      <PageHero
        surtitre="Salle de presse"
        titre="Actualités et communiqués"
        description="Suivez les décisions, les publications et les événements de l'Autorité."
      />

      <section className="section-y">
        <div className="container-content grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-8">
            {/* Featured story */}
            {featured && (
              <Card className="overflow-hidden py-0">
                <Link
                  href={`/actualites/${featured.id}`}
                  className="group grid gap-0 sm:grid-cols-2"
                >
                  <div className="relative aspect-[16/11] overflow-hidden bg-muted sm:aspect-auto">
                    <Image
                      src={featured.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="font-semibold">
                        {featured.categorie}
                      </Badge>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" aria-hidden />{" "}
                        {formaterDate(featured.date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="size-3.5" aria-hidden />{" "}
                        {featured.vues.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <h2 className="mt-4 text-balance font-heading text-xl font-semibold tracking-tight md:text-2xl">
                      {featured.titre}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {featured.extrait}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Lire l'article
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                  </CardContent>
                </Link>
              </Card>
            )}

            {/* Secondary stories */}
            <div className="grid gap-6 sm:grid-cols-2">
              {reste.map((actuality) => (
                <Card key={actuality.id} className="overflow-hidden py-0">
                  <Link
                    href={`/actualites/${actuality.id}`}
                    className="group flex h-full flex-col"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      <Image
                        src={actuality.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="font-semibold">
                          {actuality.categorie}
                        </Badge>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden />{" "}
                          {formaterDate(actuality.date)}
                        </span>
                      </div>
                      <h3 className="mt-3 text-balance font-heading text-base font-semibold leading-snug">
                        {actuality.titre}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {actuality.extrait}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        Lire l'article{" "}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>

          {/* Communiqués — grouped as a single official dossier, not a stack of identical cards */}
          <aside>
            <SectionTitle surtitre="Officiel" titre="Communiqués" />
            <Card className="mt-7">
              <CardContent className="p-0">
                {communiques.map((c, i) => (
                  <div key={c.id}>
                    {i > 0 && <Separator />}
                    <div className="p-5">
                      <p className="flex items-start gap-2.5 font-medium">
                        <FileText
                          className="mt-0.5 size-4 shrink-0 text-gold"
                          aria-hidden
                        />
                        {c.titre}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {c.contenu}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {formaterDate(c.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
