"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, Download, Eye, FileText } from "lucide-react";
import { PageHero, SectionTitle } from "@/components/site/PageHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formaterDate } from "@/data/mock";
import { useApiList } from "@/lib/hooks";

interface News {
  id: number;
  uid: string;
  title: string;
  content: string;
  category: string | null;
  views: number;
  createdAt: string;
  imageUrl: string | null;
}

interface Communique {
  id: number;
  uid: string;
  title: string;
  content: string;
  createdAt: string;
  fileUrl: string | null;
}

function extrait(html: string, maxLength = 160): string {
  const texte = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return texte.length > maxLength ? `${texte.slice(0, maxLength).trimEnd()}…` : texte;
}

export default function Actualites() {
  const { data: actualites, loading, error } = useApiList<News>("/news?lang=fr&pageSize=20");
  const { data: communiques } = useApiList<Communique>("/communiques?lang=fr&pageSize=10");
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
            {loading && <p className="text-sm text-muted-foreground">Chargement des actualités…</p>}
            {error && !loading && <p className="text-sm text-destructive">{error}</p>}

            {featured && (
              <Card className="overflow-hidden py-0">
                <Link href={`/actualites/${featured.uid}`} className="group grid gap-0 sm:grid-cols-2">
                  <div className="relative aspect-[16/11] overflow-hidden bg-muted sm:aspect-auto">
                    {featured.imageUrl && (
                      <Image
                        src={featured.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 40vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <CardContent className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {featured.category && (
                        <Badge variant="secondary" className="font-semibold">
                          {featured.category}
                        </Badge>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" aria-hidden /> {formaterDate(featured.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="size-3.5" aria-hidden /> {featured.views.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <h2 className="mt-4 text-balance font-heading text-xl font-semibold tracking-tight md:text-2xl">
                      {featured.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{extrait(featured.content)}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Lire l'article
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </CardContent>
                </Link>
              </Card>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {reste.map((actuality) => (
                <Card key={actuality.uid} className="overflow-hidden py-0 shadow-sm transition-shadow hover:shadow-md">
                  <Link href={`/actualites/${actuality.uid}`} className="group flex h-full flex-col">
                    <div className="relative">
                      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                        {actuality.imageUrl && (
                          <Image
                            src={actuality.imageUrl}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 30vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                      {actuality.category && (
                        <Badge variant="secondary" className="absolute -bottom-2.5 left-3 font-semibold shadow-sm">
                          {actuality.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="flex flex-1 flex-col p-4">
                      <h3 className="text-balance font-heading text-sm font-semibold leading-snug">
                        {actuality.title}
                      </h3>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" aria-hidden /> {formaterDate(actuality.createdAt)}
                      </span>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {extrait(actuality.content)}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-primary">
                        Lire l'article <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>

            {!loading && !error && actualites.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune actualité publiée pour l'instant.</p>
            )}
          </div>

          <aside>
            <SectionTitle surtitre="Officiel" titre="Communiqués" />
            <Card className="mt-7">
              <CardContent className="p-0">
                {communiques.map((c, i) => (
                  <div key={c.uid}>
                    {i > 0 && <Separator />}
                    <div className="p-5">
                      <p className="flex items-start gap-2.5 font-medium">
                        <FileText className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                        {c.title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.content}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">{formaterDate(c.createdAt)}</p>
                        {c.fileUrl && (
                          <a
                            href={c.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                          >
                            <Download className="size-3.5" aria-hidden /> Télécharger
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {communiques.length === 0 && (
                  <p className="p-5 text-sm text-muted-foreground">Aucun communiqué pour l'instant.</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
