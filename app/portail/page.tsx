"use client";

import Link from "next/link";
import { Bell, Briefcase, FileSignature, MessageSquareWarning, UserRound } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { StatutBadge } from "@/components/site/StatutBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formaterDate, mesCandidatures, mesReclamations, mesSoumissions, notifications } from "@/data/mock";


const resume = [
  { libelle: "Réclamations", valeur: mesReclamations.length, icon: MessageSquareWarning },
  { libelle: "Candidatures", valeur: mesCandidatures.length, icon: Briefcase },
  { libelle: "Soumissions", valeur: mesSoumissions.length, icon: FileSignature },
  { libelle: "Notifications", valeur: notifications.filter((n) => !n.lu).length, icon: Bell },
];

export default function Portail() {
  return (
    <>
      <PageHero surtitre="Espace personnel" titre="Portail usager" description="Bienvenue, Mamadou Diallo. Retrouvez ici l'ensemble de vos dossiers en cours auprès de l'Autorité.">
        <div className="inline-flex items-center gap-3 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm">
          <UserRound className="size-4" aria-hidden /> mamadou.diallo@exemple.gn
        </div>
      </PageHero>

      <section className="section-y">
        <div className="container-content">
          <dl className="grid gap-x-8 gap-y-6 border-y border-border py-6 sm:grid-cols-2 lg:grid-cols-4">
            {resume.map((r) => (
              <div key={r.libelle} className="flex items-center gap-4 py-2">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <r.icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">{r.libelle}</dt>
                  <dd className="font-heading text-2xl font-bold">{r.valeur}</dd>
                </div>
              </div>
            ))}
          </dl>

          <Tabs defaultValue="reclamations" className="mt-10">
            <TabsList className="h-auto max-w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="reclamations">Mes réclamations</TabsTrigger>
              <TabsTrigger value="candidatures">Mes candidatures</TabsTrigger>
              <TabsTrigger value="soumissions">Mes soumissions</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="reclamations" className="mt-6">
              <Tableau
                colonnes={["Référence", "Nature", "Opérateur", "Date", "Statut"]}
                lignes={mesReclamations.map((r) => [r.id, r.type, r.operateur, formaterDate(r.date), <StatutBadge key={r.id} statut={r.statut} />])}
                vide="Aucune réclamation déposée."
                action={{ to: "/reclamations", label: "Déposer une réclamation" }}
              />
            </TabsContent>

            <TabsContent value="candidatures" className="mt-6">
              <Tableau
                colonnes={["Référence", "Poste", "Date", "Statut"]}
                lignes={mesCandidatures.map((c) => [c.id, c.poste, formaterDate(c.date), <StatutBadge key={c.id} statut={c.statut} />])}
                vide="Aucune candidature en cours."
                action={{ to: "/carrieres", label: "Voir les offres" }}
              />
            </TabsContent>

            <TabsContent value="soumissions" className="mt-6">
              <Tableau
                colonnes={["Référence", "Appel d'offres", "Date", "Statut"]}
                lignes={mesSoumissions.map((s) => [s.id, s.appel, formaterDate(s.date), <StatutBadge key={s.id} statut={s.statut} />])}
                vide="Aucune soumission enregistrée."
                action={{ to: "/appels-offres", label: "Voir les appels d'offres" }}
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <ul className="divide-y divide-border border-y border-border">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-4 p-5">
                    <span className={n.lu ? "mt-1.5 size-2 shrink-0 rounded-full bg-border" : "mt-1.5 size-2 shrink-0 rounded-full bg-primary"} />
                    <div className="min-w-0">
                      <p className={n.lu ? "text-sm text-muted-foreground" : "text-sm font-medium"}>{n.titre}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formaterDate(n.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
}

function Tableau({
  colonnes,
  lignes,
  vide,
  action,
}: {
  colonnes: string[];
  lignes: React.ReactNode[][];
  vide: string;
  action: { to: string; label: string };
}) {
  return (
    <div className="min-w-0 border-y border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-muted text-left">
            <tr className="text-xs tracking-wide text-muted-foreground uppercase">
              {colonnes.map((c) => (
                <th key={c} className="px-5 py-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lignes.map((ligne, i) => (
              <tr key={i} className="transition-colors hover:bg-muted/60">
                {ligne.map((cellule, j) => (
                  <td key={j} className={j === 0 ? "px-5 py-4 font-mono text-xs text-primary" : "px-5 py-4"}>
                    {cellule}
                  </td>
                ))}
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={colonnes.length} className="px-5 py-10 text-center text-muted-foreground">
                  {vide}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border p-4">
        <Button asChild variant="outline" size="sm">
          <Link href={action.to}>{action.label}</Link>
        </Button>
      </div>
    </div>
  );
}

