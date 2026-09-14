"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { PageHero, SectionTitle } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { abonnesParMois, caParTrimestre, indicateurs, rapports } from "@/data/mock";


export default function Statistiques() {
  return (
    <>
      <PageHero
        surtitre="Observatoire"
        titre="Statistiques du secteur"
        description="Indicateurs mensuels et trimestriels consolidés par l'Autorité à partir des déclarations des opérateurs."
      />

      <section className="section-y">
        <div className="container-content">
          <dl className="grid gap-x-8 gap-y-6 border-y border-border py-6 sm:grid-cols-2 lg:grid-cols-4">
            {indicateurs.map((i) => (
              <div key={i.libelle} className="py-2">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">{i.libelle}</dt>
                <dd className="mt-2 font-heading text-3xl font-bold text-primary">{i.valeur}</dd>
                <p className="mt-1 text-xs text-muted-foreground">{i.evolution}</p>
              </div>
            ))}
          </dl>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold">Évolution du parc d'abonnés mobiles</h2>
              <p className="text-sm text-muted-foreground">En millions d'abonnés, année 2026</p>
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
                    <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[14, 17]} />
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
                      name="Abonnés (M)"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      fill="url(#grad-abonnes)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold">Chiffre d'affaires du secteur</h2>
              <p className="text-sm text-muted-foreground">En milliards de GNF, par trimestre</p>
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
                    <Bar dataKey="ca" name="CA (Mds GNF)" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-content">
          <SectionTitle surtitre="Publications" titre="Rapports sectoriels" description="Documents téléchargeables au format PDF ou Excel." />
          <div className="mt-8 border-y border-border">
            <ul className="divide-y divide-border">
              {rapports.map((r) => (
                <li key={r.id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">{r.titre}</p>
                    <p className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
                        {r.secteur}
                      </span>
                      <span>{r.annee}</span>
                      <span>
                        {r.format} · {r.taille}
                      </span>
                      <span>{r.telechargements.toLocaleString("fr-FR")} téléchargements</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="justify-self-start sm:justify-self-end">
                    <Download className="size-4" aria-hidden /> Télécharger
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

