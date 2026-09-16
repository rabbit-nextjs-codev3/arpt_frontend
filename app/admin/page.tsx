"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

type SectionId = (typeof menus)[number]["id"];
const SECTION_IDS = menus.map((m) => m.id) as SectionId[];
const DEFAULT_SECTION: SectionId = "tableau";

function isSectionId(value: string | null): value is SectionId {
  return !!value && (SECTION_IDS as string[]).includes(value);
}

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

export default function AdminPage() {
  // useSearchParams requires a Suspense boundary around whatever reads it.
  return (
    <Suspense fallback={null}>
      <Admin />
    </Suspense>
  );
}

function Admin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramSection = searchParams.get("section");
  const initialSection = isSectionId(paramSection)
    ? paramSection
    : DEFAULT_SECTION;

  const [section, setSectionState] = useState<SectionId>(initialSection);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const courant = menus.find((m) => m.id === section) ?? menus[0];

  const handleSidebarResize = useCallback((size: { asPercentage: number }) => {
    const nextCollapsed = size.asPercentage < 17;
    setSidebarCollapsed((currentCollapsed) =>
      currentCollapsed === nextCollapsed ? currentCollapsed : nextCollapsed,
    );
  }, []);

  // Keeps the nav, the URL (?section=...), and back/forward navigation all
  // in sync — previously the query param in each link's href was never read.
  const goToSection = useCallback(
    (id: SectionId) => {
      setSectionState(id);
      router.replace(`/admin?section=${id}`, { scroll: false });
    },
    [router],
  );

  const today = useMemo(() => {
    const formatted = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  return (
    <Group
      orientation="horizontal"
      defaultLayout={{ sidebar: 18, content: 82 }}
      resizeTargetMinimumSize={{ coarse: 28, fine: 16 }}
      className="h-full min-h-0 w-full"
    >
      <Panel
        id="sidebar"
        defaultSize="18%"
        minSize="5%"
        maxSize="30%"
        onResize={handleSidebarResize}
        className="h-full min-w-0"
      >
        <aside className="sticky top-0 z-10 flex h-full flex-col self-start overflow-y-auto bg-sidebar text-sidebar-foreground">
          <div
            className={cn(
              "border-b border-sidebar-border py-6 transition-[padding]",
              sidebarCollapsed ? "px-2" : "px-5",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-3",
                sidebarCollapsed && "justify-start",
              )}
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                A
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold tracking-wide uppercase">
                    Administration
                  </p>
                  <p className="mt-1 truncate text-xs opacity-60">
                    admin@arpt.gov.gn
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed((c) => !c)}
                aria-pressed={sidebarCollapsed}
                aria-label={
                  sidebarCollapsed
                    ? "Déployer la barre latérale"
                    : "Réduire la barre latérale"
                }
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary",
                  !sidebarCollapsed && "ml-auto",
                )}
              >
                <ChevronRight
                  className={cn(
                    "size-3.5 transition-transform",
                    !sidebarCollapsed && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            </div>
          </div>
          <nav
            aria-label="Sections d'administration"
            className={cn(
              "grid gap-1 py-5",
              sidebarCollapsed ? "px-2" : "px-3",
            )}
          >
            {!sidebarCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
                Pilotage
              </p>
            )}
            {menus.map((menu) => {
              const active = section === menu.id;
              return (
                <Link
                  key={menu.id}
                  href={menu.href}
                  title={sidebarCollapsed ? menu.label : undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    goToSection(menu.id);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary",
                    sidebarCollapsed ? "justify-start px-2" : "px-3",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "opacity-75 hover:bg-sidebar-accent/60 hover:opacity-100",
                  )}
                >
                  <menu.icon className="size-4 shrink-0" aria-hidden />
                  <span
                    className={cn("truncate", sidebarCollapsed && "sr-only")}
                  >
                    {menu.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          {!sidebarCollapsed && (
            <div className="mt-auto border-t border-sidebar-border px-5 py-5">
              <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                <span className="size-2 rounded-full bg-sidebar-primary" />
                Système opérationnel
              </div>
              <p className="mt-2 text-[11px] text-sidebar-foreground/45">
                Dernière synchronisation : il y a 4 min
              </p>
            </div>
          )}
        </aside>
      </Panel>
      <Separator
        className="group relative w-2 shrink-0 cursor-col-resize bg-border/70 transition-colors hover:bg-primary/40 focus-visible:bg-primary/60"
        aria-label="Redimensionner la barre latérale"
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary" />
      </Separator>
      <Panel
        id="content"
        defaultSize="82%"
        minSize="55%"
        className="h-full min-w-0 overflow-y-auto"
      >
        <div className="min-w-0 bg-surface-fade p-6 lg:p-10">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">{courant.label}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Données de démonstration — aucun backend connecté.
              </p>
            </div>
          </header>

          <div
            role="tabpanel"
            id={`panel-${section}`}
            aria-labelledby={`tab-${section}`}
          >
            {renderSection(section, { onNavigate: goToSection, today })}
          </div>
        </div>
      </Panel>
    </Group>
  );
}

function renderSection(
  section: SectionId,
  ctx: { onNavigate: (id: SectionId) => void; today: string },
) {
  switch (section) {
    case "tableau":
      return <TableauDeBord onNavigate={ctx.onNavigate} today={ctx.today} />;

    case "reclamations":
      return (
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
      );

    case "demandes":
      return (
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
      );

    case "contenus":
      return (
        <TableauAdmin
          colonnes={["Contenu", "Type", "Date", "Audience", "État"]}
          lignes={[
            ...actualites.map((a) => [
              a.titre,
              a.categorie,
              formaterDate(a.date),
              `${a.vues.toLocaleString("fr-FR")} vues`,
              <Puce key={a.id} label="Publié" tone="success" />,
            ]),
            ...communiques.map((c) => [
              c.titre,
              "Communiqué",
              formaterDate(c.date),
              "—",
              <Puce key={c.id} label="À relire" tone="warning" />,
            ]),
          ]}
        />
      );

    case "marches":
      return (
        <TableauAdmin
          colonnes={[
            "Référence",
            "Intitulé",
            "Catégorie",
            "Date limite",
            "Soumissions",
            "Statut",
          ]}
          lignes={appelsOffres.map((a) => [
            a.code,
            a.nom,
            a.categorie,
            formaterDate(a.limite),
            a.soumissions,
            <StatutBadge key={a.id} statut={a.statut} />,
          ])}
        />
      );

    case "carrieres":
      return (
        <TableauAdmin
          colonnes={[
            "Référence",
            "Poste",
            "Département",
            "Date limite",
            "Candidats",
            "Publication",
          ]}
          lignes={offresEmploi.map((o) => [
            o.code,
            o.intitule,
            o.departement,
            formaterDate(o.limite),
            o.candidats,
            o.nouveau ? (
              <Puce key={o.id} label="Nouveau" tone="info" />
            ) : (
              <Puce key={o.id} label="Publié" tone="success" />
            ),
          ])}
        />
      );

    case "equipements":
      return (
        <TableauAdmin
          colonnes={[
            "Référence",
            "Équipement",
            "Marque / modèle",
            "Catégorie",
            "Validité",
            "Statut",
          ]}
          lignes={equipements.map((eq) => [
            eq.code,
            eq.nom,
            `${eq.marque} · ${eq.modele}`,
            eq.categorie,
            eq.validite ? formaterDate(eq.validite) : "—",
            <StatutBadge key={eq.id} statut={eq.statut} />,
          ])}
        />
      );

    case "statistiques":
      return <Statistiques />;

    case "audit":
      return (
        <TableauAdmin
          colonnes={["Acteur", "Action", "Entité", "Horodatage"]}
          lignes={journalAudit.map((j) => [
            j.acteur,
            j.action,
            j.entite,
            j.date,
          ])}
        />
      );

    case "config":
      return (
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
      );

    default:
      return null;
  }
}

function TableauDeBord({
  onNavigate,
  today,
}: {
  onNavigate: (id: SectionId) => void;
  today: string;
}) {
  return (
    <div className="mt-8 grid gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-institution p-6 text-primary-foreground shadow-lifted lg:p-8">
        <div className="relative z-1 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary-foreground/65 uppercase">
            {today} · Vue d'ensemble
          </p>
          <h2 className="mt-3 font-heading text-2xl font-semibold lg:text-3xl">
            Bonjour, équipe ARPT.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">
            Voici les signaux à surveiller aujourd'hui pour garder les demandes
            usagers et les contenus publics sur la bonne trajectoire.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("reclamations")}
              className="inline-flex items-center gap-2 rounded-md bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Traiter les réclamations{" "}
              <ArrowUpRight className="size-4" aria-hidden />
            </button>
            <button
              onClick={() => onNavigate("audit")}
              className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/25 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Voir le journal <ChevronRight className="size-4" aria-hidden />
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
                {Icon && <Icon className="size-4 text-primary" aria-hidden />}
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
              onClick={() => onNavigate("reclamations")}
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
            <History className="size-4 text-muted-foreground" aria-hidden />
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
            appelsOffres.filter((appel) => appel.statut === "OUVERT").length
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
  );
}

function Statistiques() {
  return (
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
            <p className="mt-2 text-xs text-success">{indicateur.evolution}</p>
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
        colonnes={["Rapport", "Secteur", "Année", "Format", "Téléchargements"]}
        lignes={rapports.map((rapport) => [
          rapport.titre,
          rapport.secteur,
          rapport.annee,
          rapport.format,
          rapport.telechargements.toLocaleString("fr-FR"),
        ])}
      />
    </div>
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
