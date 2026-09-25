"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, CalendarDays, Download, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { formaterDate } from "@/data/mock";
import { API_BASE_URL, api } from "@/lib/api";
import { useApiOne, useApiList } from "@/lib/hooks";
import { useLocale } from "@/lib/locale-context";

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

export default function TexteReglementaire() {
  const t = useTranslations("regulationDetail");
  const { locale } = useLocale();
  const { uid } = useParams<{ uid: string }>();
  const {
    data: texte,
    loading,
    error,
  } = useApiOne<Reglementation>(
    uid ? `/regulations/${uid}?lang=${locale}` : null,
  );
  const { data: autres } = useApiList<Reglementation>(
    `/regulations?lang=${locale}&pageSize=10`,
  );
  const related = autres
    .filter((item) => item.uid !== uid && item.category === texte?.category)
    .slice(0, 5);

  useEffect(() => {
    if (!uid) return;
    api.post(`/regulations/${uid}/increment-views`).catch(() => {});
  }, [uid]);

  if (loading) {
    return (
      <Loader
        className="container-content section-y flex justify-center"
        label={t("loading")}
      />
    );
  }

  if (error || !texte) {
    return (
      <div className="container-content section-y text-center">
        <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
        <Link
          href="/reglementation"
          className="mt-4 inline-block text-primary hover:underline"
        >
          {t("backToRegulation")}
        </Link>
      </div>
    );
  }

  return (
    <main className="section-y">
      <div className="container-content grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <article className="min-w-0">
          <Link
            href="/reglementation"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden /> {t("allTexts")}
          </Link>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded bg-teal-100 px-2 py-0.5 font-semibold text-teal-900">
                  {texte.category}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden />{" "}
                  {formaterDate(texte.dateUpload)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-3.5" aria-hidden />{" "}
                  {t("views", { count: texte.views.toLocaleString(locale) })}
                </span>
                <span>{texte.format}</span>
              </div>
              <h1 className="mt-5 max-w-4xl text-2xl leading-tight font-bold tracking-tight md:text-4xl">
                {texte.name}
              </h1>
              {texte.description && (
                <p className="mt-6 max-w-[68ch] text-base leading-8 text-foreground/85">
                  {texte.description}
                </p>
              )}
              <Button asChild className="mt-8">
                <a href={`${API_BASE_URL}${texte.downloadUrl}`}>
                  <Download className="size-4" aria-hidden />{" "}
                  {t("downloadDocument")}
                </a>
              </Button>
            </div>

            {texte.fileUrl && (
              <div className="border-t border-border bg-muted">
                <iframe
                  src={texte.fileUrl}
                  title={texte.name}
                  className="h-[85vh] w-full"
                />
              </div>
            )}
          </div>
        </article>

        <aside className="lg:sticky lg:top-8">
          <div className="border-t-2 border-foreground pt-4">
            <p className="font-heading text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              {t("sameCategory")}
            </p>
            <h2 className="mt-2 font-heading text-xl font-semibold">
              {t("otherTexts")}
            </h2>
          </div>
          <div className="mt-6 divide-y divide-border">
            {related.map((item) => (
              <Link
                key={item.uid}
                href={`/reglementation/${item.uid}`}
                className="group block py-5 first:pt-0"
              >
                <div className="flex items-start gap-3">
                  <FileText
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div>
                    <h3 className="font-heading text-sm leading-snug font-semibold transition-colors group-hover:text-primary">
                      {item.name}
                    </h3>
                    <span className="mt-1.5 block text-xs text-muted-foreground">
                      {formaterDate(item.dateUpload)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {related.length === 0 && (
              <p className="py-5 text-sm text-muted-foreground">
                {t("noOtherText")}
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
