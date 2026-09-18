"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formaterDate } from "@/data/mock";
import { API_BASE_URL, api } from "@/lib/api";
import { useApiOne } from "@/lib/hooks";

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
  downloadUrl: string;
}

export default function ReglementationDetail() {
  const { uid } = useParams<{ uid: string }>();
  const { data: texte, loading, error } = useApiOne<Reglementation>(uid ? `/regulations/${uid}?lang=fr` : null);

  useEffect(() => {
    if (!uid) return;
    api.post(`/regulations/${uid}/increment-views`).catch(() => {});
  }, [uid]);

  if (loading) {
    return <div className="container-content section-y text-center text-sm text-muted-foreground">Chargement…</div>;
  }

  if (error || !texte) {
    return (
      <div className="container-content section-y text-center">
        <h1 className="text-2xl font-bold">Texte introuvable</h1>
        <Link href="/reglementation" className="mt-4 inline-block text-primary hover:underline">
          Retour à la réglementation
        </Link>
      </div>
    );
  }

  const downloadHref = `${API_BASE_URL}${texte.downloadUrl}`;

  return (
    <main className="section-y">
      <div className="container-content">
        <Link href="/reglementation" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Tous les textes
        </Link>

        <div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
              {texte.category}
            </span>
            <h1 className="mt-3 max-w-3xl text-balance text-2xl leading-tight font-bold tracking-tight md:text-4xl">
              {texte.name}
            </h1>
            {texte.description && (
              <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{texte.description}</p>
            )}
            <p className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden /> {formaterDate(texte.dateUpload)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-3.5" aria-hidden /> {texte.views.toLocaleString("fr-FR")} vues
              </span>
              <span>{texte.format}</span>
            </p>
          </div>

          <Button asChild size="sm" className="justify-self-start sm:justify-self-end">
            <a href={downloadHref}>
              <Download className="size-4" aria-hidden /> Télécharger
            </a>
          </Button>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <iframe src={texte.fileUrl} title={texte.name} className="h-[80vh] w-full" />
        </div>
      </div>
    </main>
  );
}
