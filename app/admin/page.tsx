"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Gavel,
  History,
  Inbox,
  LayoutDashboard,
  MessageSquareWarning,
  Newspaper,
  Radio,
  Settings,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Group, Panel, Separator } from "react-resizable-panels";
import { StatutBadge } from "@/components/site/StatutBadge";
import { cn } from "@/lib/utils";
import {
  caParTrimestre,
  demandesServiceAdmin,
  formaterDate,
  journalAudit,
  kpisAdmin,
  reclamationsAdmin,
  actualites,
  abonnesParMois,
  appelsOffres,
  communiques,
  equipements,
  indicateurs,
  offresEmploi,
  rapports,
} from "@/data/mock";

const menus = [
  {
    id: "tableau",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    href: "/admin?section=tableau",
  },
  {
    id: "reclamations",
    label: "Réclamations",
    icon: MessageSquareWarning,
    href: "/admin?section=reclamations",
  },
  {
    id: "demandes",
    label: "Demandes de service",
    icon: FileText,
    href: "/admin?section=demandes",
  },
  {
    id: "contenus",
    label: "Actualités & communiqués",
    icon: Newspaper,
    href: "/admin?section=contenus",
  },
  {
    id: "marches",
    label: "Appels d'offres",
    icon: Gavel,
    href: "/admin?section=marches",
  },
  {
    id: "carrieres",
    label: "Recrutements",
    icon: Briefcase,
    href: "/admin?section=carrieres",
  },
  {
    id: "equipements",
    label: "Équipements",
    icon: Radio,
    href: "/admin?section=equipements",
  },
  {
    id: "statistiques",
    label: "Statistiques",
    icon: BarChart3,
    href: "/admin?section=statistiques",
  },
  {
    id: "audit",
    label: "Journal d'audit",
    icon: History,
    href: "/admin?section=audit",
  },
  {
    id: "config",
    label: "Configuration du site",
    icon: Settings,
    href: "/admin?section=config",
  },
] as const;

const kpiIcons = [MessageSquareWarning, FileText, Users, Inbox];

const actionsPrioritaires = [
  {
    label: "Réclamations à qualifier",
    detail: "8 nouvelles demandes reçues",
    icon: AlertCircle,
    tone: "text-warning",
  },
  {
    label: "Dossiers en dépassement",
    detail: "4 demandes dépassent le délai cible",
    icon: Clock3,
    tone: "text-primary",
  },
  {
    label: "Publications à valider",
    detail: "2 contenus attendent une relecture",
    icon: Newspaper,
    tone: "text-chart-2",
  },
];

export default function Admin() {
  const [section, setSection] = useState<string>("tableau");
  const courant = menus.find((m) => m.id === section) ?? menus[0];

  return (
    <Group
      orientation="horizontal"
      defaultLayout={{ sidebar: 18, content: 82 }}
      className="h-full min-h-0 w-full"
    >
      <Panel
        id="sidebar"
        defaultSize={18}
        minSize={14}
        maxSize={30}
        className="h-full min-w-0"
      >
        <aside className="sticky top-0 z-10 flex h-full flex-col self-start overflow-y-auto bg-sidebar text-sidebar-foreground">
          <div className="border-b border-sidebar-border px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                A
              </div>
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold tracking-wide uppercase">
                  Administration
                </p>
                <p className="mt-1 truncate text-xs opacity-60">
                  admin@arpt.gov.gn
                </p>
              </div>
            </div>
          </div>
          <nav className="grid gap-1 px-3 py-5">
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
              Pilotage
            </p>
            {menus.map((menu) => (
              <Link
                key={menu.id}
                href={menu.href}
                onClick={(e) => {
                  e.preventDefault();
                  setSection(menu.id);
                }}
                className={cn(
                  "flex items-center cursor-pointer gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  section === menu.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "opacity-75 hover:bg-sidebar-accent/60 hover:opacity-100",
                )}
              >
                <menu.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{menu.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-sidebar-border px-5 py-5">
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
              <span className="size-2 rounded-full bg-sidebar-primary" />
              Système opérationnel
            </div>
            <p className="mt-2 text-[11px] text-sidebar-foreground/45">
              Dernière synchronisation : il y a 4 min
            </p>
          </div>
        </aside>
      </Panel>
      <Separator
        className="group relative w-2 shrink-0 bg-border/70 transition-colors hover:bg-primary/40 focus-visible:bg-primary/60"
        aria-label="Redimensionner la barre latérale"
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
      </Separator>
      <Panel
        id="content"
        defaultSize={82}
        minSize={55}
        className="h-full min-w-0 overflow-y-auto"
      >
        <div className="min-w-0 bg-surface-fade p-6 lg:p-10">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">{courant.label}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Données de démonstration aucun backend connecté.
              </p>
            </div>
          </header>

          {section === "tableau" && (
            <div className="mt-8 grid gap-6">
              <section className="relative overflow-hidden rounded-2xl bg-institution p-6 text-primary-foreground shadow-lifted lg:p-8">
                <div className="relative z-1 max-w-2xl">
                  <p className="text-xs font-semibold tracking-[0.16em] text-primary-foreground/65 uppercase">
                    Vendredi 11 septembre 2026 · Vue d'ensemble
                  </p>
                  <h2 className="mt-3 font-heading text-2xl font-semibold lg:text-3xl">
                    Bonjour, équipe ARPT.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">
                    Voici les signaux à surveiller aujourd'hui pour garder les
                    demandes usagers et les contenus publics sur la bonne
                    trajectoire.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => setSection("reclamations")}
                      className="inline-flex items-center gap-2 rounded-md bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition-transform hover:-translate-y-0.5"
                    >
                      Traiter les réclamations{" "}
                      <ArrowUpRight className="size-4" aria-hidden />
                    </button>
                    <button
                      onClick={() => setSection("audit")}
                      className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/25 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
                    >
                      Voir le journal{" "}
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <div
                  className="absolute -right-12 -bottom-24 size-64 rounded-full border-24 border-primary-foreground/10"
                  aria-hidden
                />
              </section>

              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpisAdmin.map((k, index) => {
                  const Icon = kpiIcons[index];
                  return (
                    <div
                      key={k.libelle}
                      className="rounded-xl border border-border bg-card p-5 shadow-soft"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <dt className="max-w-48 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          {k.libelle}
                        </dt>
                        <Icon className="size-4 text-primary" aria-hidden />
                      </div>
                      <dd className="mt-4 font-heading text-3xl font-bold text-foreground">
                        {k.valeur}
                      </dd>
                      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-success">
                        <ArrowUpRight className="size-3" aria-hidden />
                        {k.detail}
                      </p>
                    </div>
                  );
                })}
              </dl>

              <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">
                        Chiffre d'affaires déclaré
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Évolution trimestrielle · milliards GNF
                      </p>
                    </div>
                    <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                      +7,1 %
                    </span>
                  </div>
                  <div className="mt-6 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={caParTrimestre}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--color-border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="trimestre"
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          fontSize={12}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--color-muted)" }}
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius)",
                            fontSize: "0.8rem",
                          }}
                        />
                        <Bar
                          dataKey="ca"
                          name="CA (Mds GNF)"
                          fill="var(--color-chart-1)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">
                        À traiter aujourd'hui
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Priorités opérationnelles
                      </p>
                    </div>
                    <span className="grid size-8 place-items-center rounded-full bg-warning/15 text-sm font-bold text-warning-foreground">
                      14
                    </span>
                  </div>
                  <ul className="mt-5 divide-y divide-border">
                    {actionsPrioritaires.map((action) => (
                      <li
                        key={action.label}
                        className="flex gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <action.icon
                          className={cn("mt-0.5 size-4 shrink-0", action.tone)}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{action.label}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {action.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="min-w-0 rounded-xl border border-border bg-card shadow-soft">
                  <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 lg:px-6">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">
                        Réclamations récentes
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Derniers signalements des usagers
                      </p>
                    </div>
                    <button
                      onClick={() => setSection("reclamations")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Tout voir
                    </button>
                  </div>
                  <TableauAdmin
                    compact
                    colonnes={["Référence", "Nature", "Opérateur", "Statut"]}
                    lignes={reclamationsAdmin
                      .slice(0, 3)
                      .map((r) => [
                        r.id,
                        r.type,
                        r.operateur,
                        <StatutBadge key={r.id} statut={r.statut} />,
                      ])}
                  />
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">
                        Activité récente
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Journal des dernières actions
                      </p>
                    </div>
                    <History
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                  <ul className="mt-5 space-y-4">
                    {journalAudit.map((j) => (
                      <li key={j.id} className="flex gap-3">
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-success"
                          aria-hidden
                        />
                        <div>
                          <p className="text-sm font-medium">{j.action}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {j.acteur} · {j.date}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <MiniSignal
                  label="Contenus publiés"
                  value={actualites.length + communiques.length}
                  detail="Actualités et communiqués actifs"
                  icon={Newspaper}
                />
                <MiniSignal
                  label="Appels d'offres ouverts"
                  value={
                    appelsOffres.filter((appel) => appel.statut === "OUVERT")
                      .length
                  }
                  detail="Suivi des échéances en cours"
                  icon={Gavel}
                />
                <MiniSignal
                  label="Postes à pourvoir"
                  value={offresEmploi.filter((offre) => offre.nouveau).length}
                  detail="Nouvelles offres cette période"
                  icon={Briefcase}
                />
              </div>
            </div>
          )}

          {section === "reclamations" && (
            <TableauAdmin
              colonnes={[
                "Référence",
                "Usager",
                "Nature",
                "Opérateur",
                "Date",
                "Statut",
              ]}
              lignes={reclamationsAdmin.map((r) => [
                r.id,
                r.usager,
                r.type,
                r.operateur,
                formaterDate(r.date),
                <StatutBadge key={r.id} statut={r.statut} />,
              ])}
            />
          )}

          {section === "demandes" && (
            <TableauAdmin
              colonnes={["Référence", "Service", "Société", "Date", "Statut"]}
              lignes={demandesServiceAdmin.map((d) => [
                d.id,
                d.service,
                d.societe,
                formaterDate(d.date),
                <StatutBadge key={d.id} statut={d.statut} />,
              ])}
            />
          )}

          {section === "audit" && (
            <TableauAdmin
              colonnes={["Acteur", "Action", "Entité", "Horodatage"]}
              lignes={journalAudit.map((j) => [
                j.acteur,
                j.action,
                j.entite,
                j.date,
              ])}
            />
          )}

          {section === "contenus" && (
            <TableauAdmin
              colonnes={["Contenu", "Type", "Date", "Audience", "État"]}
              lignes={[
                ...actualites.map((actualite) => [
                  actualite.titre,
                  actualite.categorie,
                  formaterDate(actualite.date),
                  `${actualite.vues.toLocaleString("fr-FR")} vues`,
                  <Puce key={actualite.id} label="Publié" tone="success" />,
                ]),
                ...communiques.map((communique) => [
                  communique.titre,
                  "Communiqué",
                  formaterDate(communique.date),
                  "—",
                  <Puce key={communique.id} label="À relire" tone="warning" />,
                ]),
              ]}
            />
          )}
          {section === "marches" && (
            <TableauAdmin
              colonnes={[
                "Référence",
                "Intitulé",
                "Catégorie",
                "Date limite",
                "Soumissions",
                "Statut",
              ]}
              lignes={appelsOffres.map((appel) => [
                appel.code,
                appel.nom,
                appel.categorie,
                formaterDate(appel.limite),
                appel.soumissions,
                <StatutBadge key={appel.id} statut={appel.statut} />,
              ])}
            />
          )}
          {section === "carrieres" && (
            <TableauAdmin
              colonnes={[
                "Référence",
                "Poste",
                "Département",
                "Date limite",
                "Candidats",
                "Publication",
              ]}
              lignes={offresEmploi.map((offre) => [
                offre.code,
                offre.intitule,
                offre.departement,
                formaterDate(offre.limite),
                offre.candidats,
                offre.nouveau ? (
                  <Puce key={offre.id} label="Nouveau" tone="info" />
                ) : (
                  <Puce key={offre.id} label="Publié" tone="success" />
                ),
              ])}
            />
          )}
          {section === "equipements" && (
            <TableauAdmin
              colonnes={[
                "Référence",
                "Équipement",
                "Marque / modèle",
                "Catégorie",
                "Validité",
                "Statut",
              ]}
              lignes={equipements.map((equipement) => [
                equipement.code,
                equipement.nom,
                `${equipement.marque} · ${equipement.modele}`,
                equipement.categorie,
                equipement.validite ? formaterDate(equipement.validite) : "—",
                <StatutBadge key={equipement.id} statut={equipement.statut} />,
              ])}
            />
          )}
          {section === "statistiques" && (
            <div className="mt-8 grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {indicateurs.map((indicateur) => (
                  <div
                    key={indicateur.libelle}
                    className="rounded-xl border border-border bg-card p-5 shadow-soft"
                  >
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {indicateur.libelle}
                    </p>
                    <p className="mt-3 font-heading text-2xl font-bold text-primary">
                      {indicateur.valeur}
                    </p>
                    <p className="mt-2 text-xs text-success">
                      {indicateur.evolution}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                <h2 className="font-heading text-lg font-semibold">
                  Parc d'abonnés mobiles
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Évolution mensuelle · millions d'abonnés
                </p>
                <div className="mt-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={abonnesParMois}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="mois"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                      />
                      <YAxis
                        domain={[14, 17]}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius)",
                          fontSize: "0.8rem",
                        }}
                      />
                      <Bar
                        dataKey="abonnes"
                        name="Abonnés (M)"
                        fill="var(--color-chart-2)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <TableauAdmin
                colonnes={[
                  "Rapport",
                  "Secteur",
                  "Année",
                  "Format",
                  "Téléchargements",
                ]}
                lignes={rapports.map((rapport) => [
                  rapport.titre,
                  rapport.secteur,
                  rapport.annee,
                  rapport.format,
                  rapport.telechargements.toLocaleString("fr-FR"),
                ])}
              />
            </div>
          )}
          {section === "config" && (
            <TableauAdmin
              colonnes={[
                "Paramètre",
                "Valeur actuelle",
                "Dernière modification",
                "État",
              ]}
              lignes={[
                [
                  "Nom de l'institution",
                  "ARPT Guinée",
                  "04 septembre 2026",
                  <Puce key="nom" label="Actif" tone="success" />,
                ],
                [
                  "Adresse de contact",
                  "contact@arpt.gov.gn",
                  "28 août 2026",
                  <Puce key="email" label="Actif" tone="success" />,
                ],
                [
                  "Délai de traitement par défaut",
                  "30 jours ouvrés",
                  "12 août 2026",
                  <Puce key="delai" label="À vérifier" tone="warning" />,
                ],
                [
                  "Mode maintenance",
                  "Désactivé",
                  "01 janvier 2026",
                  <Puce key="maintenance" label="Normal" tone="info" />,
                ],
              ]}
            />
          )}
        </div>
      </Panel>
    </Group>
  );
}

function TableauAdmin({
  colonnes,
  lignes,
  compact = false,
}: {
  colonnes: string[];
  lignes: React.ReactNode[][];
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto",
        !compact && "mt-8 border-y border-border",
      )}
    >
      <table className={cn("w-full text-sm", !compact && "min-w-3xl")}>
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
                <td
                  key={j}
                  className={cn(
                    j === 0 ? "font-mono text-xs text-primary" : "",
                    "px-5",
                    compact ? "py-3" : "py-4",
                  )}
                >
                  {cellule}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniSignal({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Newspaper;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-primary">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function Puce({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "info";
}) {
  const styles = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    info: "bg-accent text-accent-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[tone],
      )}
    >
      {label}
    </span>
  );
}
