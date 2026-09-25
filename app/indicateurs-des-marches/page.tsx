"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Download,
  Eye,
  Mail,
  ReceiptText,
  Search,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContentBlock } from "@/lib/hooks";

type ObservatoryCategory = "telecom" | "tariff" | "postal";
interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}
interface MarketReport {
  id: number;
  title: string;
  category: ObservatoryCategory;
  year: number | null;
  quarter: number | null;
  period: "quarterly" | "annual" | "other";
  pdfUrl: string | null;
}
interface MarketReportsResponse {
  count: number;
  years: number[];
  counts: Record<ObservatoryCategory, number>;
  reports: MarketReport[];
}

const HERO_DEFAULT: HeroContent = {
  surtitre: "Observatoires ARPT",
  titre: "Indicateurs des marchés",
  description:
    "Explorez les études officielles des marchés télécoms, des tarifs et des activités postales en Guinée.",
};

const CATEGORY_ICONS = {
  telecom: BarChart3,
  tariff: ReceiptText,
  postal: Mail,
} as const;

export default function IndicateursDesMarches() {
  const t = useTranslations("statisticsPage");
  const { data: hero } = useContentBlock<HeroContent>(
    "statistics.hero",
    HERO_DEFAULT,
  );
  const [data, setData] = useState<MarketReportsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState<"all" | ObservatoryCategory>("all");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/indicateurs-des-marches", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? t("error"));
        return body as MarketReportsResponse;
      })
      .then(setData)
      .catch((reason: unknown) => {
        if ((reason as Error).name !== "AbortError")
          setError(reason instanceof Error ? reason.message : t("error"));
      });
    return () => controller.abort();
  }, [t]);

  const reports = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return (data?.reports ?? []).filter(
      (report) =>
        (category === "all" || report.category === category) &&
        (year === "all" || report.year === Number(year)) &&
        (!needle || report.title.toLocaleLowerCase().includes(needle)),
    );
  }, [category, data, query, year]);

  return (
    <>
      <PageHero
        surtitre={hero.surtitre}
        titre={t("pageTitle")}
        description={hero.description}
      />

      <section className="section-y">
        <div className="container-content">
          {/* Sticky Observatories Cards Section */}
          {data && (
            <div className="sticky top-20 z-20 mb-10 rounded-2xl bg-background/95 pb-2 backdrop-blur-md">
              <div className="grid gap-4 sm:grid-cols-3">
                {(["telecom", "tariff", "postal"] as ObservatoryCategory[]).map(
                  (item) => {
                    const Icon = CATEGORY_ICONS[item];
                    const active = category === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(active ? "all" : item)}
                        aria-pressed={active}
                        className={`flex items-center gap-4 rounded-xl border p-5 text-left transition shadow-soft ${
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`grid size-11 shrink-0 place-items-center rounded-lg ${active ? "bg-white/15" : "bg-primary/10 text-primary"}`}
                        >
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block font-heading font-semibold">
                            {t(`categories.${item}`)}
                          </span>
                          <span
                            className={`mt-0.5 block text-sm ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}
                          >
                            {t("categoryCount", { count: data.counts[item] })}
                          </span>
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Sticky Filter and Search Bar Section */}
          <div className="sticky top-[10.5rem] z-10 flex flex-col justify-between gap-5 border-b border-border bg-background/95 pb-6 backdrop-blur-md lg:flex-row lg:items-end">
            <div>
              {data ? (
                <p className="text-sm font-semibold text-primary">
                  {t("filteredCount", {
                    count: reports.length,
                    total: data.count,
                  })}
                </p>
              ) : (
                <Loader className="py-1" label={t("loading")} />
              )}
              <h2 className="mt-1 font-heading text-2xl font-bold">
                {t("archiveTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("archiveDescription")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(14rem,20rem)_11rem_9rem]">
              <label className="relative">
                <span className="sr-only">{t("searchLabel")}</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  className="pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                />
              </label>
              <Select
                value={category}
                onValueChange={(value) =>
                  value && setCategory(value as typeof category)
                }
              >
                <SelectTrigger aria-label={t("categoryLabel")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCategories")}</SelectItem>
                  <SelectItem value="telecom">
                    {t("categories.telecom")}
                  </SelectItem>
                  <SelectItem value="tariff">
                    {t("categories.tariff")}
                  </SelectItem>
                  <SelectItem value="postal">
                    {t("categories.postal")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={year}
                onValueChange={(value) => value && setYear(value)}
              >
                <SelectTrigger aria-label={t("yearLabel")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allYears")}</SelectItem>
                  {(data?.years ?? []).map((item) => (
                    <SelectItem key={item} value={String(item)}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
              {error}
            </div>
          )}
          {!data && !error && (
            <Loader
              className="mt-8 flex justify-center py-16"
              label={t("loading")}
            />
          )}
          {data && reports.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">
              {t("noResults")}
            </p>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => {
              const Icon = CATEGORY_ICONS[report.category];
              const readerUrl = `/indicateurs-des-marches/${report.id}`;
              const documentUrl = `/api/indicateurs-des-marches/${report.id}/document?download=1`;
              return (
                <article
                  key={report.id}
                  className="group flex min-h-56 flex-col rounded-xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {report.period === "quarterly" && report.quarter
                        ? `T${report.quarter} ${report.year}`
                        : (report.year ?? t("report"))}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold tracking-wide text-primary uppercase">
                    {t(`categories.${report.category}`)}
                  </p>
                  <h3 className="mt-1 line-clamp-3 font-heading text-base leading-snug font-semibold">
                    {report.title}
                  </h3>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <Button asChild size="sm">
                      <Link href={readerUrl}>
                        <Eye aria-hidden />
                        {t("readReport")}
                      </Link>
                    </Button>
                    {report.pdfUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={documentUrl}>
                          <Download aria-hidden />
                          <span className="sr-only">{t("downloadPdf")}</span>
                        </a>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
