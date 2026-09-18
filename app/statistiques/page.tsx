"use client";

import { useTranslations } from "next-intl";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHero } from "@/components/site/PageHero";
import { useApiOne, useContentBlock } from "@/lib/hooks";
import { useLocale } from "@/lib/locale-context";

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "Observatoire",
  titre: "Statistiques du secteur",
  description:
    "Indicateurs mensuels et trimestriels consolidés par l'Autorité à partir des déclarations des opérateurs.",
};

interface Overview {
  year: number;
  availableYears: number[];
  kpis: {
    subscribersMillion: number;
    penetrationRate: number;
    activeOperators: number;
    active4GSites: number;
  };
  monthlySeries: { month: number; subscribersMillion: number }[];
  quarterlySeries: { year: number; quarter: number; revenueBillionGNF: number }[];
}

export default function Statistiques() {
  const t = useTranslations("statisticsPage");
  const { locale } = useLocale();
  const MOIS = t.raw("months") as string[];
  const { data: hero } = useContentBlock<HeroContent>("statistics.hero", HERO_DEFAUT);
  const { data: overview, loading, error } = useApiOne<Overview>(`/statistics/overview?lang=${locale}`);

  const indicateurs = overview
    ? [
        { libelle: t("mobileSubscribers"), valeur: `${overview.kpis.subscribersMillion.toLocaleString(locale)} M` },
        { libelle: t("penetrationRate"), valeur: `${overview.kpis.penetrationRate} %` },
        { libelle: t("activeOperators"), valeur: `${overview.kpis.activeOperators}` },
        { libelle: t("active4GSites"), valeur: overview.kpis.active4GSites.toLocaleString(locale) },
      ]
    : [];

  const abonnesParMois = (overview?.monthlySeries ?? []).map((m) => ({
    mois: MOIS[m.month - 1] ?? m.month,
    abonnes: m.subscribersMillion,
  }));

  const caParTrimestre = (overview?.quarterlySeries ?? []).map((q) => ({
    trimestre: `T${q.quarter} ${q.year}`,
    ca: q.revenueBillionGNF,
  }));

  return (
    <>
      <PageHero surtitre={hero.surtitre} titre={hero.titre} description={hero.description} />

      <section className="section-y">
        <div className="container-content">
          {loading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
          {error && !loading && <p className="text-sm text-destructive">{error}</p>}

          {overview && (
            <>
              <dl className="grid gap-x-8 gap-y-6 border-y border-border py-6 sm:grid-cols-2 lg:grid-cols-4">
                {indicateurs.map((i) => (
                  <div key={i.libelle} className="py-2">
                    <dt className="text-xs tracking-wide text-muted-foreground uppercase">{i.libelle}</dt>
                    <dd className="mt-2 font-heading text-3xl font-bold text-primary">{i.valeur}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-border bg-card p-6">
                  <h2 className="font-heading text-lg font-semibold">{t("subscribersChartTitle")}</h2>
                  <p className="text-sm text-muted-foreground">{t("subscribersChartSubtitle", { year: overview.year })}</p>
                  <div className="mt-6 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={abonnesParMois}>
                        <defs>
                          <linearGradient id="grad-abonnes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius)",
                            fontSize: "0.8rem",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="abonnes"
                          name={t("subscribersSeriesName")}
                          stroke="var(--color-chart-1)"
                          strokeWidth={2}
                          fill="url(#grad-abonnes)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-border bg-card p-6">
                  <h2 className="font-heading text-lg font-semibold">{t("revenueChartTitle")}</h2>
                  <p className="text-sm text-muted-foreground">{t("revenueChartSubtitle")}</p>
                  <div className="mt-6 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={caParTrimestre}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="trimestre" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip
                          cursor={{ fill: "var(--color-muted)" }}
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius)",
                            fontSize: "0.8rem",
                          }}
                        />
                        <Bar dataKey="ca" name={t("revenueSeriesName")} fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
