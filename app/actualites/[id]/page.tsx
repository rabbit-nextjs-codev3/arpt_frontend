"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Eye, ArrowUpRight } from "lucide-react";
import { actualites, formaterDate } from "@/data/mock";

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const article = actualites.find((a) => String(a.id) === id);
  if (!article)
    return (
      <div className="container-content section-y text-center">
        <h1 className="text-2xl font-bold">Article introuvable</h1>
        <Link
          href="/actualites"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Retour aux actualités
        </Link>
      </div>
    );

  const related = actualites.filter((item) => item.id !== article.id);

  return (
    <main className="section-y">
      <div className="container-content grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <article className="min-w-0">
          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden /> Toutes les actualités
          </Link>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="relative aspect-video bg-muted">
              <Image
                src={article.image}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 65vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-accent px-2.5 py-0.5 font-semibold text-accent-foreground">
                  {article.categorie}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden />{" "}
                  {formaterDate(article.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-3.5" aria-hidden />{" "}
                  {article.vues.toLocaleString("fr-FR")} vues
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl text-3xl leading-tight font-bold tracking-tight md:text-5xl">
                {article.titre}
              </h1>
              <p className="mt-7 border-l-2 border-gold pl-5 text-lg leading-8 text-muted-foreground">
                {article.extrait}
              </p>
              <div className="mt-8 max-w-[68ch] text-base leading-8 text-foreground/85">
                <p>{article.contenu}</p>
              </div>
            </div>
          </div>
        </article>

        <aside className="lg:sticky lg:top-8">
          <div className="border-t-2 border-foreground pt-4">
            <p className="font-heading text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              À lire ensuite
            </p>
            <h2 className="mt-2 font-heading text-xl font-semibold">
              Autres actualités
            </h2>
          </div>
          <div className="mt-6 divide-y divide-border">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/actualites/${item.id}`}
                className="group block py-5 first:pt-0"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20rem, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold tracking-wide text-primary uppercase">
                  <span>{item.categorie}</span>
                  <span className="text-muted-foreground">
                    {formaterDate(item.date)}
                  </span>
                </div>
                <h3 className="mt-2 font-heading text-base leading-snug font-semibold transition-colors group-hover:text-primary">
                  {item.titre}
                </h3>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                  Lire l'article{" "}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
