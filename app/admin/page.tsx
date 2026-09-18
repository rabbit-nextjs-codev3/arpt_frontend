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
  FileCheck2,
  FileText,
  Gavel,
  History,
  Inbox,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquareWarning,
  Newspaper,
  Bell,
  ChevronDown,
  LogOut,
  MessageSquare,
  Pencil,
  Radio,
  Search,
  Trash2,
  UserRound,
  ScrollText,
  Settings,
  Smartphone,
  TowerControl,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Group, Panel, Separator } from "react-resizable-panels";
import { toast } from "sonner";
import { StatutBadge } from "@/components/site/StatutBadge";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth, ApiError } from "@/lib/auth";
import { useApiOne, useApiList, useContentBlockRaw } from "@/lib/hooks";
import { apiFetch } from "@/lib/api";
import { formaterDate } from "@/data/mock";

interface MenuItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "reclamationsOuvertes" | "demandesNouvelles" | "messagesNonLus";
}

const menuGroups: { titre: string; items: MenuItem[] }[] = [
  {
    titre: "Vue d'ensemble",
    items: [{ id: "tableau", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    titre: "Usagers",
    items: [
      { id: "reclamations", label: "Réclamations", icon: MessageSquareWarning, badgeKey: "reclamationsOuvertes" },
      { id: "demandes", label: "Demandes de service", icon: FileText, badgeKey: "demandesNouvelles" },
      { id: "messages", label: "Messages de contact", icon: Inbox, badgeKey: "messagesNonLus" },
    ],
  },
  {
    titre: "Contenu du site",
    items: [
      { id: "pages", label: "Pages publiques", icon: LayoutTemplate },
      { id: "services", label: "Services", icon: Layers },
      { id: "equipements", label: "Équipements", icon: Radio },
      { id: "marches", label: "Appels d'offres", icon: Gavel },
      { id: "carrieres", label: "Recrutements", icon: Briefcase },
      { id: "actualites", label: "Actualités", icon: Newspaper },
      { id: "communiques", label: "Communiqués", icon: FileCheck2 },
      { id: "reglementation", label: "Réglementation", icon: ScrollText },
      { id: "consultations", label: "Consultations publiques", icon: Vote },
    ],
  },
  {
    titre: "Analyse",
    items: [
      { id: "statistiques", label: "Statistiques", icon: BarChart3 },
      { id: "audit", label: "Journal d'audit", icon: History },
    ],
  },
  {
    titre: "Administration",
    items: [
      { id: "utilisateurs", label: "Utilisateurs & rôles", icon: Users },
      { id: "config", label: "Configuration du site", icon: Settings },
    ],
  },
];

const menus = menuGroups.flatMap((g) => g.items).map((m) => ({ ...m, href: `/admin?section=${m.id}` }));


const kpiIcons = [MessageSquareWarning, FileText, Users, Inbox];

interface AdminOverview {
  reclamations: { total: number; ouvertes: number } | null;
  demandesService: { total: number; nouvelles: number } | null;
  candidatures: { total: number; offresActives: number } | null;
  messagesContact: { nonLus: number } | null;
}

interface QuarterlyPoint {
  year: number;
  quarter: number;
  revenueBillionGNF: number;
}

interface MonthlyPoint {
  month: number;
  subscribersMillion: number;
}

interface SectorOverview {
  year: number;
  kpis: {
    subscribersMillion: number;
    penetrationRate: number;
    activeOperators: number;
    active4GSites: number;
  };
  monthlySeries: MonthlyPoint[];
  quarterlySeries: QuarterlyPoint[];
}

const MOIS_COURTS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

interface ClaimAdmin {
  id: number;
  claimType: string;
  concernedOperator: string;
  status: "NOUVEAU" | "EN_COURS" | "RESOLU" | "REJETE";
}

interface AuditLogEntry {
  id: number;
  action: string;
  entity: string;
  createdAt: string;
  actor: { email: string; fullname: string } | null;
}

interface NotificationAdmin {
  id: number;
  title: string;
  isRead: boolean;
  createdAt: string;
}

export default function Admin() {
  const [section, setSection] = useState<string>("tableau");
  const courant = menus.find((m) => m.id === section) ?? menus[0];
  const { user, loading: authLoading, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const staff = Boolean(user?.isStaff);
  const { data: overview } = useApiOne<AdminOverview>(staff ? "/dashboard/admin-overview" : null);
  const { data: notifications, refetch: refetchNotifications } = useApiList<NotificationAdmin>(
    staff ? "/notifications?pageSize=8" : null,
  );
  const notifsNonLues = notifications.filter((n) => !n.isRead).length;
  const { data: overviewStats } = useApiOne<SectorOverview>(staff ? "/statistics/overview?lang=fr" : null);
  const { data: reclamationsRecentes } = useApiList<ClaimAdmin>(staff ? "/claims?lang=fr&pageSize=3" : null);
  const { data: activiteRecente } = useApiList<AuditLogEntry>(staff ? "/audit-logs?pageSize=5" : null);
  const { data: newsReelles } = useApiList<{ id: number }>(staff ? "/news?pageSize=100" : null);
  const { data: communiquesReels } = useApiList<{ id: number }>(staff ? "/communiques?pageSize=100" : null);
  const { data: tendersReels } = useApiList<{ status: string }>(staff ? "/tenders?pageSize=100" : null);
  const { data: careersReels } = useApiList<{ isNew: boolean }>(staff ? "/careers?pageSize=100" : null);
  const { data: reglementationsReelles } = useApiList<{ id: number }>(staff ? "/regulations?pageSize=100" : null);
  const { data: consultationsReelles } = useApiList<{ status: string }>(
    staff ? "/public-consultations?pageSize=100" : null,
  );

  const kpisReels = overview
    ? [
        { libelle: "Réclamations ouvertes", valeur: overview.reclamations?.ouvertes ?? "—" },
        { libelle: "Demandes de service", valeur: overview.demandesService?.total ?? "—" },
        { libelle: "Candidatures reçues", valeur: overview.candidatures?.total ?? "—" },
        { libelle: "Messages non lus", valeur: overview.messagesContact?.nonLus ?? "—" },
      ]
    : [];

  const caReel = (overviewStats?.quarterlySeries ?? []).map((q) => ({
    trimestre: `T${q.quarter} ${q.year}`,
    ca: q.revenueBillionGNF,
  }));

  const abonnesReel = (overviewStats?.monthlySeries ?? []).map((m) => ({
    mois: MOIS_COURTS[m.month - 1] ?? m.month,
    abonnes: m.subscribersMillion,
  }));

  const indicateursSectoriels = overviewStats
    ? [
        { libelle: "Abonnés mobiles", valeur: `${overviewStats.kpis.subscribersMillion.toLocaleString("fr-FR")} M`, icon: Smartphone },
        { libelle: "Taux de pénétration", valeur: `${overviewStats.kpis.penetrationRate} %`, icon: TrendingUp },
        { libelle: "Opérateurs actifs", valeur: `${overviewStats.kpis.activeOperators}`, icon: Users },
        { libelle: "Sites 4G en service", valeur: overviewStats.kpis.active4GSites.toLocaleString("fr-FR"), icon: TowerControl },
      ]
    : [];

  const variationCA =
    caReel.length >= 2
      ? ((caReel[caReel.length - 1].ca - caReel[caReel.length - 2].ca) / caReel[caReel.length - 2].ca) * 100
      : null;

  const actionsReelles = overview
    ? [
        {
          label: "Réclamations à qualifier",
          detail: `${overview.reclamations?.ouvertes ?? 0} dossier(s) ouvert(s)`,
          icon: AlertCircle,
          tone: "text-warning",
        },
        {
          label: "Demandes de service nouvelles",
          detail: `${overview.demandesService?.nouvelles ?? 0} en attente de traitement`,
          icon: Clock3,
          tone: "text-primary",
        },
        {
          label: "Messages de contact non lus",
          detail: `${overview.messagesContact?.nonLus ?? 0} message(s) à traiter`,
          icon: Newspaper,
          tone: "text-chart-2",
        },
      ]
    : [];

  if (authLoading) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Chargement…</div>;
  }

  if (!user?.isStaff) {
    return <AdminLogin />;
  }

  return (
    <Group orientation="horizontal" className="h-full min-h-0 w-full">
      <Panel id="sidebar" defaultSize="18" minSize="14" maxSize="30" className="h-full min-w-0">
        <aside className="sticky top-0 z-10 flex h-full flex-col self-start overflow-y-auto bg-sidebar text-sidebar-foreground">
          <div className="border-b border-sidebar-border px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">A</div>
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold tracking-wide uppercase">Administration</p>
                <p className="mt-1 truncate text-xs opacity-60">{user.email}</p>
              </div>
            </div>
          </div>
          <nav className="grid gap-4 px-3 py-5">
            {menuGroups.map((group) => (
              <div key={group.titre} className="grid gap-1">
                <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
                  {group.titre}
                </p>
                {group.items.map((menu) => {
                  const badgeValue = menu.badgeKey
                    ? menu.badgeKey === "reclamationsOuvertes"
                      ? overview?.reclamations?.ouvertes
                      : menu.badgeKey === "demandesNouvelles"
                        ? overview?.demandesService?.nouvelles
                        : overview?.messagesContact?.nonLus
                    : undefined;
                  return (
                    <Link
                      key={menu.id}
                      href={`/admin?section=${menu.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSection(menu.id);
                      }}
                      className={cn(
                        "flex items-center cursor-pointer gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        section === menu.id
                          ? "border-gold bg-sidebar-accent text-sidebar-accent-foreground"
                          : "border-transparent opacity-75 hover:bg-sidebar-accent/60 hover:opacity-100",
                      )}
                    >
                      <menu.icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{menu.label}</span>
                      {!!badgeValue && (
                        <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-gold-foreground">
                          {badgeValue}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="mt-auto border-t border-sidebar-border px-5 py-5">
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70"><span className="size-2 rounded-full bg-sidebar-primary" />Connecté à l'API ARPT</div>
          </div>
        </aside>
      </Panel>
      <Separator className="group relative w-2 shrink-0 bg-border/70 transition-colors hover:bg-primary/40 focus-visible:bg-primary/60" aria-label="Redimensionner la barre latérale">
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
      </Separator>
      <Panel id="content" defaultSize="82" minSize="55" className="h-full min-w-0 overflow-y-auto">

        <div className="sticky top-0 z-10 flex h-[66px] items-center gap-5 border-b border-border bg-card px-6">
          <div className="flex max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              type="text"
              placeholder="Rechercher une réclamation, un dossier, un usager…"
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSection("audit")}
              title="Journal d'audit"
              className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <History className="size-[18px]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setSection("messages")}
              title="Messages"
              className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <MessageSquare className="size-[18px]" aria-hidden />
              {!!overview?.messagesContact?.nonLus && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-card bg-gold" />
              )}
            </button>
            <div className="relative">
              <button
                type="button"
                title="Notifications"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <Bell className="size-[18px]" aria-hidden />
                {notifsNonLues > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-card bg-gold" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute top-full right-0 z-20 mt-2 w-80 rounded-md border border-border bg-card p-1.5 shadow-lg">
                  <div className="flex items-center justify-between px-2.5 py-2">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Notifications
                    </span>
                    {notifsNonLues > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch("/notifications/read-all", { method: "POST" });
                          refetchNotifications();
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={async () => {
                          if (n.isRead) return;
                          await apiFetch(`/notifications/${n.id}/read`, { method: "POST" });
                          refetchNotifications();
                        }}
                        className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface"
                      >
                        <span
                          className={
                            n.isRead
                              ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-border"
                              : "mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                          }
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className={n.isRead ? "block text-xs text-muted-foreground" : "block text-xs font-medium"}>
                            {n.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {formaterDate(n.createdAt)}
                          </span>
                        </span>
                      </button>
                    ))}
                    {notifications.length === 0 && (
                      <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">Aucune notification.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <LocaleSwitcher className="border-none bg-transparent shadow-none" />
            <div className="mx-1.5 h-6 w-px bg-border" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-md py-1.5 pr-2 pl-1.5 transition-colors hover:bg-surface"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-gold-foreground">
                  {user.fullname.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs leading-tight font-semibold">{user.fullname}</span>
                  <span className="block text-[11px] leading-tight text-muted-foreground">
                    {user.isSuperuser ? "Super Admin" : (user.role?.name ?? "Administrateur")}
                  </span>
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
              </button>
              {userMenuOpen && (
                <div className="absolute top-full right-0 z-20 mt-2 w-48 rounded-md border border-border bg-card p-1.5 shadow-lg">
                  <div className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground">
                    <UserRound className="size-3.5" aria-hidden /> {user.email}
                  </div>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" aria-hidden /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 bg-surface-fade p-6 lg:p-10">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">{courant.label}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Données en temps réel depuis l'API ARPT.</p>
            </div>

          </header>

          {section === "tableau" && (
            <div className="mt-8 grid gap-6">
              <section className="relative overflow-hidden rounded-2xl bg-institution p-6 text-primary-foreground shadow-lifted lg:p-8">
                <div className="relative z-1 max-w-2xl">
                  <p className="text-xs font-semibold tracking-[0.16em] text-primary-foreground/65 uppercase">
                    {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · Vue d'ensemble
                  </p>
                  <h2 className="mt-3 font-heading text-2xl font-semibold lg:text-3xl">Bonjour, {user.fullname.split(" ")[0]}.</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">Voici les signaux à surveiller aujourd'hui pour garder les demandes usagers et les contenus publics sur la bonne trajectoire.</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => setSection("reclamations")} className="inline-flex items-center gap-2 rounded-md bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition-transform hover:-translate-y-0.5">Traiter les réclamations <ArrowUpRight className="size-4" aria-hidden /></button>
                    <button onClick={() => setSection("audit")} className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/25 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10">Voir le journal <ChevronRight className="size-4" aria-hidden /></button>
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-24 size-64 rounded-full border-24 border-primary-foreground/10" aria-hidden />
              </section>

              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpisReels.map((k, index) => {
                  const Icon = kpiIcons[index];
                  return (
                    <div key={k.libelle} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                      <div className="flex items-start justify-between gap-3"><dt className="max-w-48 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{k.libelle}</dt><Icon className="size-4 text-primary" aria-hidden /></div>
                      <dd className="mt-4 font-heading text-3xl font-bold text-foreground">{k.valeur}</dd>
                    </div>
                  );
                })}
              </dl>

              {indicateursSectoriels.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Observatoire du secteur · {overviewStats?.year}
                  </p>
                  <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {indicateursSectoriels.map((k) => (
                      <div key={k.libelle} className="rounded-xl border border-border bg-surface p-5">
                        <div className="flex items-start justify-between gap-3">
                          <dt className="max-w-48 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{k.libelle}</dt>
                          <k.icon className="size-4 text-primary" aria-hidden />
                        </div>
                        <dd className="mt-4 font-heading text-2xl font-bold text-foreground">{k.valeur}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">Chiffre d'affaires déclaré</h2>
                      <p className="mt-1 text-xs text-muted-foreground">Évolution trimestrielle · milliards GNF</p>
                    </div>
                    {variationCA !== null && (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          variationCA >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {variationCA >= 0 ? "+" : ""}
                        {variationCA.toFixed(1)} %
                      </span>
                    )}
                  </div>
                  <div className="mt-6 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={caReel}>
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
                        <Bar dataKey="ca" name="CA (Mds GNF)" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">À traiter aujourd'hui</h2>
                      <p className="mt-1 text-xs text-muted-foreground">Priorités opérationnelles</p>
                    </div>
                    <span className="grid size-8 place-items-center rounded-full bg-warning/15 text-sm font-bold text-warning-foreground">
                      {(overview?.reclamations?.ouvertes ?? 0) +
                        (overview?.demandesService?.nouvelles ?? 0) +
                        (overview?.messagesContact?.nonLus ?? 0)}
                    </span>
                  </div>
                  <ul className="mt-5 divide-y divide-border">
                    {actionsReelles.map((action) => <li key={action.label} className="flex gap-3 py-4 first:pt-0 last:pb-0"><action.icon className={cn("mt-0.5 size-4 shrink-0", action.tone)} aria-hidden /><div className="min-w-0"><p className="text-sm font-medium">{action.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{action.detail}</p></div></li>)}
                  </ul>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                  <h2 className="font-heading text-lg font-semibold">Parc d'abonnés mobiles</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Évolution mensuelle · millions d'abonnés</p>
                  <div className="mt-6 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={abonnesReel}>
                        <defs>
                          <linearGradient id="grad-abonnes-admin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius)",
                            fontSize: "0.8rem",
                          }}
                        />
                        <Area type="monotone" dataKey="abonnes" name="Abonnés (M)" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#grad-abonnes-admin)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                  <h2 className="font-heading text-lg font-semibold">Répartition du contenu public</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Volumes actuellement en ligne</p>
                  <dl className="mt-5 grid grid-cols-2 gap-4">
                    <ContenuStat label="Actualités" value={newsReelles.length} icon={Newspaper} />
                    <ContenuStat label="Communiqués" value={communiquesReels.length} icon={FileCheck2} />
                    <ContenuStat label="Réglementations" value={reglementationsReelles.length} icon={ScrollText} />
                    <ContenuStat label="Consultations" value={consultationsReelles.length} icon={Vote} />
                    <ContenuStat label="AO ouverts" value={tendersReels.filter((t) => t.status === "OUVERT").length} icon={Gavel} />
                    <ContenuStat label="Postes ouverts" value={careersReels.length} icon={Briefcase} />
                  </dl>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="min-w-0 rounded-xl border border-border bg-card shadow-soft">
                  <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 lg:px-6"><div><h2 className="font-heading text-lg font-semibold">Réclamations récentes</h2><p className="mt-1 text-xs text-muted-foreground">Derniers signalements des usagers</p></div><button onClick={() => setSection("reclamations")} className="text-xs font-semibold text-primary hover:underline">Tout voir</button></div>
                  <TableauAdmin
                    compact
                    colonnes={["Référence", "Nature", "Opérateur", "Statut"]}
                    lignes={reclamationsRecentes.map((r) => [
                      `REC-${r.id}`,
                      r.claimType,
                      r.concernedOperator,
                      <StatutBadge key={r.id} statut={r.status} />,
                    ])}
                  />
                  {reclamationsRecentes.length === 0 && (
                    <p className="px-5 py-6 text-center text-xs text-muted-foreground">Aucune réclamation pour l'instant.</p>
                  )}
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                  <div className="flex items-center justify-between gap-4"><div><h2 className="font-heading text-lg font-semibold">Activité récente</h2><p className="mt-1 text-xs text-muted-foreground">Journal des dernières actions</p></div><History className="size-4 text-muted-foreground" aria-hidden /></div>
                  <ul className="mt-5 space-y-4">
                    {activiteRecente.map((j) => (
                      <li key={j.id} className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        <div>
                          <p className="text-sm font-medium">{j.action}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {j.actor?.email ?? "Système"} · {formaterDate(j.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                    {activiteRecente.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground">Aucune activité pour l'instant.</p>
                    )}
                  </ul>
                </div>
              </div>

            </div>
          )}

          {section === "pages" && <PagesPubliquesAdmin />}
          {section === "reclamations" && <ReclamationsAdmin />}
          {section === "demandes" && <DemandesServiceAdmin />}
          {section === "audit" && <AuditAdmin />}
          {section === "actualites" && <ActualitesAdmin />}
          {section === "communiques" && <CommuniquesAdmin />}
          {section === "services" && <ServicesAdmin />}
          {section === "marches" && <AppelsOffresAdmin />}
          {section === "carrieres" && <CarrieresAdmin />}
          {section === "equipements" && <EquipementsAdmin />}
          {section === "messages" && <MessagesAdmin />}
          {section === "reglementation" && <ReglementationAdmin />}
          {section === "consultations" && <ConsultationsAdmin />}
          {section === "utilisateurs" && <UtilisateursAdmin />}
          {section === "statistiques" && <StatistiquesAdmin />}
          {section === "config" && <ConfigurationAdmin />}

        </div>
      </Panel>
    </Group>
  );
}

function TableauAdmin({
  colonnes,
  lignes,
  compact = false,
  codeColumn = true,
}: {
  colonnes: string[];
  lignes: React.ReactNode[][];
  compact?: boolean;
  /** La 1ère colonne est-elle une référence courte (code) ? Sinon, pas de style monospace. */
  codeColumn?: boolean;
}) {
  return (
    <div className={cn("overflow-x-auto", !compact && "mt-8 border-y border-border")}>
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
                <td key={j} className={cn(j === 0 && codeColumn ? "font-mono text-xs text-primary" : "", "px-5", compact ? "py-3" : "py-4")}>
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

function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-1">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Modifier"
          title="Modifier"
          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Supprimer"
          title="Supprimer"
          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

function ContenuStat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Newspaper }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-lg font-bold text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface EquipementAdmin {
  id: number;
  uid: string;
  code: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  manufacturer: string;
  status: "HOMOLOGUE" | "INTERDIT" | "EN_COURS";
  category: { id: number; slug: string; name: string };
  validUntil: string | null;
  homologationNumber?: string | null;
}

interface EquipmentCategoryOption {
  id: number;
  slug: string;
  name: string;
}

const EQUIPMENT_STATUTS: { value: EquipementAdmin["status"]; label: string }[] = [
  { value: "HOMOLOGUE", label: "Homologué" },
  { value: "EN_COURS", label: "En cours d'instruction" },
  { value: "INTERDIT", label: "Interdit" },
];

function EquipementsAdmin() {
  const { data: equipements, loading, error, refetch } = useApiList<EquipementAdmin>("/equipment?lang=fr&pageSize=100");
  const { data: categories } = useApiOne<EquipmentCategoryOption[]>("/equipment-categories?lang=fr");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EquipementAdmin | null>(null);
  const [status, setStatus] = useState<EquipementAdmin["status"] | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function ouvrirCreation() {
    setEditing(null);
    setStatus("");
    setCategoryId("");
    setShowForm((v) => !v);
  }

  function ouvrirEdition(e: EquipementAdmin) {
    setEditing(e);
    setStatus(e.status);
    setCategoryId(String(e.category.id));
    setShowForm(true);
  }

  async function supprimer(e: EquipementAdmin) {
    if (!window.confirm(`Supprimer l'équipement "${e.name}" ?`)) return;
    try {
      await apiFetch(`/equipment/${e.id}`, { method: "DELETE" });
      toast.success("Équipement supprimé.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!status || !categoryId) {
      setFormError("Merci de sélectionner un statut et une catégorie.");
      return;
    }
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    body.append("code", String(form.get("code")));
    body.append("nameFr", String(form.get("nameFr")));
    body.append("typeFr", String(form.get("typeFr")));
    body.append("brand", String(form.get("brand")));
    body.append("model", String(form.get("model")));
    body.append("manufacturer", String(form.get("manufacturer")));
    body.append("status", status);
    body.append("categoryId", categoryId);
    if (form.get("homologationNumber")) body.append("homologationNumber", String(form.get("homologationNumber")));
    if (form.get("validUntil")) body.append("validUntil", String(form.get("validUntil")));
    const certificate = form.get("certificate") as File;
    if (certificate && certificate.size > 0) body.append("certificate", certificate);

    try {
      if (editing) {
        await apiFetch(`/equipment/${editing.id}`, { method: "PATCH", body });
        toast.success("Équipement modifié.");
      } else {
        await apiFetch("/equipment", { method: "POST", body });
        toast.success("Équipement ajouté avec succès.");
      }
      setShowForm(false);
      setEditing(null);
      setStatus("");
      setCategoryId("");
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{equipements.length} équipement(s) enregistré(s)</p>
        <Button size="sm" onClick={ouvrirCreation}>
          {showForm && !editing ? "Annuler" : "+ Nouvel équipement"}
        </Button>
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? `Modifier "${editing.name}"` : "Nouvel équipement"}</p>
          <div className="grid gap-2">
            <Label htmlFor="eq-code">Code *</Label>
            <Input id="eq-code" name="code" required placeholder="Ex. : EQ-2026-0180" defaultValue={editing?.code} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-name">Nom de l'équipement *</Label>
            <Input id="eq-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-type">Type *</Label>
            <Input id="eq-type" name="typeFr" required placeholder="Ex. : Terminal data" defaultValue={editing?.type} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-status">Statut *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EquipementAdmin["status"])}>
              <SelectTrigger id="eq-status">
                <SelectValue placeholder="Sélectionner…" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_STATUTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-brand">Marque *</Label>
            <Input id="eq-brand" name="brand" required defaultValue={editing?.brand} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-model">Modèle *</Label>
            <Input id="eq-model" name="model" required defaultValue={editing?.model} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-manufacturer">Fabricant *</Label>
            <Input id="eq-manufacturer" name="manufacturer" required defaultValue={editing?.manufacturer} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-category">Catégorie *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="eq-category">
                <SelectValue placeholder="Sélectionner…" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-homolog">Numéro d'homologation</Label>
            <Input id="eq-homolog" name="homologationNumber" placeholder="Facultatif" defaultValue={editing?.homologationNumber ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-validite">Valide jusqu'au</Label>
            <Input id="eq-validite" name="validUntil" type="date" defaultValue={editing?.validUntil?.slice(0, 10) ?? ""} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="eq-certificate">Certificat (PDF, {editing ? "laisser vide pour conserver l'actuel" : "facultatif"})</Label>
            <Input id="eq-certificate" name="certificate" type="file" accept=".pdf" />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Enregistrer l'équipement"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      )}

      {loading && <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>}
      {error && !loading && <p className="mt-6 text-sm text-destructive">{error}</p>}
      {!loading && !error && (
        <TableauAdmin
          colonnes={["Référence", "Équipement", "Marque / modèle", "Catégorie", "Validité", "Statut", "Actions"]}
          lignes={equipements.map((e) => [
            e.code,
            e.name,
            `${e.brand} · ${e.model}`,
            e.category.name,
            e.validUntil ? formaterDate(e.validUntil) : "—",
            <StatutBadge key={e.id} statut={e.status} />,
            <RowActions key={e.id} onEdit={() => ouvrirEdition(e)} onDelete={() => supprimer(e)} />,
          ])}
        />
      )}
    </div>
  );
}

interface ClaimAdminFull {
  id: number;
  firstname: string;
  lastname: string;
  concernedOperator: string;
  claimType: string;
  status: "NOUVEAU" | "EN_COURS" | "RESOLU" | "REJETE";
  createdAt: string;
}

const CLAIM_STATUTS: ClaimAdminFull["status"][] = ["NOUVEAU", "EN_COURS", "RESOLU", "REJETE"];

function ClaimStatusSelect({ claim, onUpdated }: { claim: ClaimAdminFull; onUpdated: () => void }) {
  const [pending, setPending] = useState(false);

  async function changer(status: string) {
    if (status === claim.status) return;
    if (status === "REJETE") {
      const reason = window.prompt("Motif du refus (au moins 10 caractères) :");
      if (!reason || reason.trim().length < 10) {
        toast.error("Motif de refus requis (10 caractères minimum).");
        return;
      }
      setPending(true);
      try {
        await apiFetch(`/claims/${claim.id}/status`, { method: "PATCH", body: JSON.stringify({ status, reason }) });
        toast.success("Statut mis à jour.");
        onUpdated();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
      } finally {
        setPending(false);
      }
      return;
    }
    setPending(true);
    try {
      await apiFetch(`/claims/${claim.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success("Statut mis à jour.");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Select value={claim.status} onValueChange={changer} disabled={pending}>
      <SelectTrigger className="h-8 w-40 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CLAIM_STATUTS.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ReclamationsAdmin() {
  const { data: claims, loading, error, refetch } = useApiList<ClaimAdminFull>("/claims?lang=fr&pageSize=100");

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <TableauAdmin
      codeColumn={false}
      colonnes={["Usager", "Nature", "Opérateur", "Date", "Statut"]}
      lignes={claims.map((c) => [
        `${c.firstname} ${c.lastname}`,
        c.claimType,
        c.concernedOperator,
        formaterDate(c.createdAt),
        <ClaimStatusSelect key={c.id} claim={c} onUpdated={refetch} />,
      ])}
    />
  );
}

interface ServiceRequestAdmin {
  id: number;
  fullname: string;
  company: string | null;
  service: { name: string };
  status: "NOUVEAU" | "EN_COURS" | "TRAITE" | "REJETE";
  createdAt: string;
}

const SERVICE_REQUEST_STATUTS: ServiceRequestAdmin["status"][] = ["NOUVEAU", "EN_COURS", "TRAITE", "REJETE"];

function ServiceRequestStatusSelect({ demande, onUpdated }: { demande: ServiceRequestAdmin; onUpdated: () => void }) {
  const [pending, setPending] = useState(false);

  async function changer(status: string) {
    if (status === demande.status) return;
    setPending(true);
    try {
      await apiFetch(`/service-requests/${demande.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success("Statut mis à jour.");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Select value={demande.status} onValueChange={changer} disabled={pending}>
      <SelectTrigger className="h-8 w-36 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SERVICE_REQUEST_STATUTS.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DemandesServiceAdmin() {
  const { data: demandes, loading, error, refetch } = useApiList<ServiceRequestAdmin>(
    "/service-requests?lang=fr&pageSize=100",
  );

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <TableauAdmin
      codeColumn={false}
      colonnes={["Demandeur", "Service", "Société", "Date", "Statut"]}
      lignes={demandes.map((d) => [
        d.fullname,
        d.service.name,
        d.company ?? "—",
        formaterDate(d.createdAt),
        <ServiceRequestStatusSelect key={d.id} demande={d} onUpdated={refetch} />,
      ])}
    />
  );
}

function AuditAdmin() {
  const { data: logs, loading, error } = useApiList<AuditLogEntry>("/audit-logs?pageSize=100");

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <TableauAdmin
      codeColumn={false}
      colonnes={["Acteur", "Action", "Entité", "Horodatage"]}
      lignes={logs.map((j) => [j.actor?.email ?? "Système", j.action, j.entity, formaterDate(j.createdAt)])}
    />
  );
}

interface TendersCallAdmin {
  id: number;
  code: string;
  name: string;
  description: string;
  category: { id: number; name: string };
  publicationDate: string;
  limitDate: string;
  budget: number | null;
  contactName: string;
  contactEmail: string;
  submissionCount: number;
  status: "OUVERT" | "CLOTURE" | "ANNULE";
}

const TENDER_STATUTS = ["OUVERT", "CLOTURE", "ANNULE"] as const;
const CONSULTATION_STATUTS = ["OUVERTE", "CLOTUREE"] as const;

function AppelsOffresAdmin() {
  const { data: tenders, loading, error, refetch } = useApiList<TendersCallAdmin>("/tenders?lang=fr&pageSize=100");
  const { data: categories } = useApiOne<{ id: number; name: string }[]>("/tender-categories?lang=fr");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TendersCallAdmin | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<string>("OUVERT");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function ouvrirCreation() {
    setEditing(null);
    setCategoryId("");
    setStatus("OUVERT");
    setShowForm((v) => !v);
  }

  function ouvrirEdition(t: TendersCallAdmin) {
    setEditing(t);
    setCategoryId(String(t.category.id));
    setStatus(t.status);
    setShowForm(true);
  }

  async function supprimer(t: TendersCallAdmin) {
    if (!window.confirm(`Supprimer l'appel d'offres "${t.name}" ?`)) return;
    try {
      await apiFetch(`/tenders/${t.id}`, { method: "DELETE" });
      toast.success("Appel d'offres supprimé.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!categoryId) {
      setFormError("Merci de sélectionner une catégorie.");
      return;
    }
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    body.append("code", String(form.get("code")));
    body.append("nameFr", String(form.get("nameFr")));
    body.append("descriptionFr", String(form.get("descriptionFr")));
    body.append("categoryId", categoryId);
    body.append("status", status);
    body.append("publicationDate", String(form.get("publicationDate")));
    body.append("limitDate", String(form.get("limitDate")));
    body.append("contactName", String(form.get("contactName")));
    body.append("contactEmail", String(form.get("contactEmail")));
    if (form.get("budget")) body.append("budget", String(form.get("budget")));
    const dossier = form.get("dossier") as File;
    if (dossier && dossier.size > 0) body.append("file", dossier);

    try {
      if (editing) {
        await apiFetch(`/tenders/${editing.id}`, { method: "PATCH", body });
        toast.success("Appel d'offres modifié.");
      } else {
        await apiFetch("/tenders", { method: "POST", body });
        toast.success("Appel d'offres créé.");
      }
      setShowForm(false);
      setEditing(null);
      setCategoryId("");
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{tenders.length} appel(s) d'offres</p>
        <Button size="sm" onClick={ouvrirCreation}>
          {showForm && !editing ? "Annuler" : "+ Nouvel appel d'offres"}
        </Button>
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? `Modifier "${editing.name}"` : "Nouvel appel d'offres"}</p>
          <div className="grid gap-2">
            <Label htmlFor="ao-code">Code *</Label>
            <Input id="ao-code" name="code" required placeholder="Ex. : AO-2026-020" defaultValue={editing?.code} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-name">Intitulé *</Label>
            <Input id="ao-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="ao-description">Description *</Label>
            <Textarea id="ao-description" name="descriptionFr" required rows={3} defaultValue={editing?.description} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-category">Catégorie *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="ao-category">
                <SelectValue placeholder="Sélectionner…" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-status">Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="ao-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TENDER_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-pub">Date de publication *</Label>
            <Input id="ao-pub" name="publicationDate" type="date" required defaultValue={editing?.publicationDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-limit">Date limite *</Label>
            <Input id="ao-limit" name="limitDate" type="date" required defaultValue={editing?.limitDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-budget">Budget (GNF)</Label>
            <Input id="ao-budget" name="budget" type="number" placeholder="Facultatif" defaultValue={editing?.budget ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-contact-name">Nom du contact *</Label>
            <Input id="ao-contact-name" name="contactName" required defaultValue={editing?.contactName} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-contact-email">Email du contact *</Label>
            <Input id="ao-contact-email" name="contactEmail" type="email" required defaultValue={editing?.contactEmail} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="ao-dossier">Dossier d'appel d'offres (PDF, {editing ? "laisser vide pour conserver l'actuel" : "facultatif"})</Label>
            <Input id="ao-dossier" name="dossier" type="file" accept=".pdf" />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer l'appel d'offres"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      )}

      <TableauAdmin
        colonnes={["Référence", "Intitulé", "Catégorie", "Date limite", "Soumissions", "Statut", "Actions"]}
        lignes={tenders.map((t) => [
          t.code,
          t.name,
          t.category.name,
          formaterDate(t.limitDate),
          t.submissionCount,
          <StatutBadge key={t.id} statut={t.status} />,
          <RowActions key={t.id} onEdit={() => ouvrirEdition(t)} onDelete={() => supprimer(t)} />,
        ])}
      />
    </div>
  );
}

interface CareerAdmin {
  id: number;
  code: string;
  name: string;
  description: string;
  departement: string;
  location: string | null;
  salary: string | null;
  category: { id: number; name: string };
  publicationDate: string;
  limitDate: string;
  contactName: string;
  contactEmail: string;
  candidatCount: number;
  isNew: boolean;
}

function CarrieresAdmin() {
  const { data: careers, loading, error, refetch } = useApiList<CareerAdmin>("/careers?lang=fr&pageSize=100");
  const { data: categories } = useApiOne<{ id: number; name: string }[]>("/career-categories?lang=fr");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CareerAdmin | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function ouvrirCreation() {
    setEditing(null);
    setCategoryId("");
    setShowForm((v) => !v);
  }

  function ouvrirEdition(c: CareerAdmin) {
    setEditing(c);
    setCategoryId(String(c.category.id));
    setShowForm(true);
  }

  async function supprimer(c: CareerAdmin) {
    if (!window.confirm(`Supprimer l'offre "${c.name}" ?`)) return;
    try {
      await apiFetch(`/careers/${c.id}`, { method: "DELETE" });
      toast.success("Offre d'emploi supprimée.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!categoryId) {
      setFormError("Merci de sélectionner une catégorie.");
      return;
    }
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    body.append("code", String(form.get("code")));
    body.append("nameFr", String(form.get("nameFr")));
    body.append("descriptionFr", String(form.get("descriptionFr")));
    body.append("departementFr", String(form.get("departementFr")));
    if (form.get("locationFr")) body.append("locationFr", String(form.get("locationFr")));
    if (form.get("salary")) body.append("salary", String(form.get("salary")));
    body.append("categoryId", categoryId);
    body.append("publicationDate", String(form.get("publicationDate")));
    body.append("limitDate", String(form.get("limitDate")));
    body.append("contactName", String(form.get("contactName")));
    body.append("contactEmail", String(form.get("contactEmail")));

    try {
      if (editing) {
        await apiFetch(`/careers/${editing.id}`, { method: "PATCH", body });
        toast.success("Offre d'emploi modifiée.");
      } else {
        await apiFetch("/careers", { method: "POST", body });
        toast.success("Offre d'emploi créée.");
      }
      setShowForm(false);
      setEditing(null);
      setCategoryId("");
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{careers.length} offre(s) d'emploi</p>
        <Button size="sm" onClick={ouvrirCreation}>
          {showForm && !editing ? "Annuler" : "+ Nouvelle offre"}
        </Button>
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? `Modifier "${editing.name}"` : "Nouvelle offre d'emploi"}</p>
          <div className="grid gap-2">
            <Label htmlFor="cr-code">Code *</Label>
            <Input id="cr-code" name="code" required placeholder="Ex. : REC-2026-11" defaultValue={editing?.code} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-name">Intitulé du poste *</Label>
            <Input id="cr-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cr-description">Description *</Label>
            <Textarea id="cr-description" name="descriptionFr" required rows={3} defaultValue={editing?.description} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-departement">Département *</Label>
            <Input id="cr-departement" name="departementFr" required defaultValue={editing?.departement} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-category">Catégorie *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="cr-category">
                <SelectValue placeholder="Sélectionner…" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-location">Lieu</Label>
            <Input id="cr-location" name="locationFr" placeholder="Ex. : Conakry" defaultValue={editing?.location ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-salary">Salaire</Label>
            <Input id="cr-salary" name="salary" placeholder="Facultatif" defaultValue={editing?.salary ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-pub">Date de publication *</Label>
            <Input id="cr-pub" name="publicationDate" type="date" required defaultValue={editing?.publicationDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-limit">Date limite *</Label>
            <Input id="cr-limit" name="limitDate" type="date" required defaultValue={editing?.limitDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-contact-name">Nom du contact *</Label>
            <Input id="cr-contact-name" name="contactName" required defaultValue={editing?.contactName} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-contact-email">Email du contact *</Label>
            <Input id="cr-contact-email" name="contactEmail" type="email" required defaultValue={editing?.contactEmail} />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer l'offre"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      )}

      <TableauAdmin
        colonnes={["Référence", "Poste", "Département", "Date limite", "Candidats", "Publication", "Actions"]}
        lignes={careers.map((c) => [
          c.code,
          c.name,
          c.departement,
          formaterDate(c.limitDate),
          c.candidatCount,
          c.isNew ? <Puce key={c.id} label="Nouveau" tone="info" /> : <Puce key={c.id} label="Publié" tone="success" />,
          <RowActions key={c.id} onEdit={() => ouvrirEdition(c)} onDelete={() => supprimer(c)} />,
        ])}
      />
    </div>
  );
}

function StatistiquesAdmin() {
  const { data: overview, loading, error } = useApiOne<SectorOverview>("/statistics/overview?lang=fr");
  const { data: reports, loading: loadingReports } = useApiList<{
    id: number;
    title: string;
    sector: string;
    year: number;
    format: string;
    downloadCount: number;
    fileUrl: string;
  }>("/statistics/reports?lang=fr&pageSize=100");

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;
  if (!overview) return null;

  const abonnesParMoisReel = overview.monthlySeries.map((m) => ({
    mois: MOIS_COURTS[m.month - 1] ?? m.month,
    abonnes: m.subscribersMillion,
  }));

  return (
    <div className="mt-8 grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Abonnés mobiles</p>
          <p className="mt-3 font-heading text-2xl font-bold text-primary">{overview.kpis.subscribersMillion} M</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Taux de pénétration</p>
          <p className="mt-3 font-heading text-2xl font-bold text-primary">{overview.kpis.penetrationRate} %</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Opérateurs actifs</p>
          <p className="mt-3 font-heading text-2xl font-bold text-primary">{overview.kpis.activeOperators}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Sites 4G en service</p>
          <p className="mt-3 font-heading text-2xl font-bold text-primary">{overview.kpis.active4GSites.toLocaleString("fr-FR")}</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
        <h2 className="font-heading text-lg font-semibold">Parc d'abonnés mobiles</h2>
        <p className="mt-1 text-xs text-muted-foreground">Évolution mensuelle · millions d'abonnés</p>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={abonnesParMoisReel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", fontSize: "0.8rem" }} />
              <Bar dataKey="abonnes" name="Abonnés (M)" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {!loadingReports && (
        <TableauAdmin
          codeColumn={false}
          colonnes={["Rapport", "Secteur", "Année", "Format", "Téléchargements", "Fichier"]}
          lignes={reports.map((r) => [
            r.title,
            r.sector,
            r.year,
            r.format,
            r.downloadCount.toLocaleString("fr-FR"),
            <a key={r.id} href={r.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
              Ouvrir
            </a>,
          ])}
        />
      )}
    </div>
  );
}

interface SiteConfig {
  contactInfo: { address?: { fr?: string }; phone?: string; phoneSecondary?: string; email?: string; hours?: { fr?: string } };
  socialLinks: { facebook?: string; twitter?: string; linkedin?: string; youtube?: string; instagram?: string };
  footerText: { fr?: string };
}

function ConfigurationAdmin() {
  const { data: config, loading, error, refetch } = useApiOne<SiteConfig>("/site-config");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;
  if (!config) return null;

  async function enregistrer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = {
      contactInfo: {
        phone: String(form.get("phone") || ""),
        phoneSecondary: String(form.get("phoneSecondary") || ""),
        email: String(form.get("email") || ""),
        address: { fr: String(form.get("address") || "") },
        hours: { fr: String(form.get("hours") || "") },
      },
      socialLinks: {
        facebook: String(form.get("facebook") || ""),
        twitter: String(form.get("twitter") || ""),
        linkedin: String(form.get("linkedin") || ""),
        youtube: String(form.get("youtube") || ""),
      },
      footerText: { fr: String(form.get("footerText") || "") },
    };
    try {
      await apiFetch("/site-config", { method: "PATCH", body: JSON.stringify(body) });
      toast.success("Configuration enregistrée.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="mt-8 grid max-w-2xl gap-5 rounded-xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cfg-phone">Téléphone</Label>
          <Input id="cfg-phone" name="phone" defaultValue={config.contactInfo?.phone ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-phone2">Téléphone secondaire</Label>
          <Input id="cfg-phone2" name="phoneSecondary" defaultValue={config.contactInfo?.phoneSecondary ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-email">Email de contact</Label>
          <Input id="cfg-email" name="email" type="email" defaultValue={config.contactInfo?.email ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-address">Adresse</Label>
          <Input id="cfg-address" name="address" defaultValue={config.contactInfo?.address?.fr ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-hours">Horaires d'ouverture</Label>
          <Input id="cfg-hours" name="hours" defaultValue={config.contactInfo?.hours?.fr ?? ""} placeholder="Ex. : Lundi – Vendredi, 08h00 – 17h00" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cfg-fb">Facebook</Label>
          <Input id="cfg-fb" name="facebook" defaultValue={config.socialLinks?.facebook ?? ""} placeholder="https://facebook.com/…" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-tw">X (Twitter)</Label>
          <Input id="cfg-tw" name="twitter" defaultValue={config.socialLinks?.twitter ?? ""} placeholder="https://x.com/…" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-li">LinkedIn</Label>
          <Input id="cfg-li" name="linkedin" defaultValue={config.socialLinks?.linkedin ?? ""} placeholder="https://linkedin.com/…" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-yt">YouTube</Label>
          <Input id="cfg-yt" name="youtube" defaultValue={config.socialLinks?.youtube ?? ""} placeholder="https://youtube.com/…" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cfg-footer">Texte du pied de page</Label>
        <Input id="cfg-footer" name="footerText" defaultValue={config.footerText?.fr ?? ""} />
      </div>
      <Button type="submit" disabled={submitting} className="justify-self-start">
        {submitting ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function envoyer(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("image", file);
    try {
      const res = await apiFetch<{ url: string }>("/site-config/upload-image", { method: "POST", body });
      onChange(res.url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur d'envoi de l'image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      {value && <img src={value} alt="" className="h-20 w-auto rounded-lg border border-border object-cover" />}
      <Input type="file" accept="image/*" disabled={uploading} onChange={envoyer} />
      {uploading && <p className="text-xs text-muted-foreground">Envoi en cours…</p>}
    </div>
  );
}

function FileField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function envoyer(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await apiFetch<{ url: string }>("/site-config/upload-file", { method: "POST", body });
      onChange(res.url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur d'envoi du fichier.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      {value && (
        <a href={value} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
          Voir le fichier actuel
        </a>
      )}
      <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" disabled={uploading} onChange={envoyer} />
      {uploading && <p className="text-xs text-muted-foreground">Envoi en cours…</p>}
    </div>
  );
}

type BlockFieldType = "text" | "textarea" | "image" | "file" | "select";

interface BlockFieldDef {
  name: string;
  label: string;
  type: BlockFieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Uniquement pour type "text"/"textarea" : édité en {fr, en, ar} au lieu d'une chaîne unique. */
  translatable?: boolean;
}

interface I18nBlockValue {
  fr: string;
  en?: string;
  ar?: string;
}

type BlockFieldValue = string | I18nBlockValue;
type BlockItem = Record<string, BlockFieldValue>;

/** Valeur "vide" adaptée au type du champ — sert de défaut quand une ligne
 * nouvellement ajoutée n'a encore aucune valeur pour ce champ. */
function emptyBlockValue(field: BlockFieldDef): BlockFieldValue {
  return field.translatable ? { fr: "" } : "";
}

function blockValueIsFilled(v: BlockFieldValue): boolean {
  return typeof v === "string" ? v.trim() !== "" : Object.values(v).some((s) => (s ?? "").trim() !== "");
}

/** Chaîne d'affichage pour un `itemLabel` (fr, quelle que soit la langue en cours d'édition dans l'admin). */
function blockLabel(v: BlockFieldValue | undefined): string {
  if (v === undefined) return "";
  return typeof v === "string" ? v : (v.fr ?? "");
}

const BLOCK_LANGS: { code: keyof I18nBlockValue; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
];

function TranslatableBlockInput({
  type,
  value,
  placeholder,
  onChange,
}: {
  type: "text" | "textarea";
  value: I18nBlockValue;
  placeholder?: string;
  onChange: (v: I18nBlockValue) => void;
}) {
  const [tab, setTab] = useState<keyof I18nBlockValue>("fr");
  const courant = value[tab] ?? "";
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {BLOCK_LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setTab(l.code)}
            className={cn(
              "rounded px-2 py-0.5 text-xs font-semibold transition-colors",
              tab === l.code
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            {l.label}
            {l.code !== "fr" && !value[l.code]?.trim() && <span className="ml-1 opacity-60">·</span>}
          </button>
        ))}
      </div>
      {type === "textarea" ? (
        <Textarea
          rows={2}
          value={courant}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, [tab]: e.target.value })}
        />
      ) : (
        <Input
          value={courant}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, [tab]: e.target.value })}
        />
      )}
    </div>
  );
}

function BlockFieldInput({
  field,
  value,
  onChange,
}: {
  field: BlockFieldDef;
  value: BlockFieldValue;
  onChange: (v: BlockFieldValue) => void;
}) {
  if (field.translatable && (field.type === "text" || field.type === "textarea")) {
    const i18nValue = typeof value === "string" ? { fr: value } : value;
    return (
      <TranslatableBlockInput
        type={field.type}
        value={i18nValue}
        placeholder={field.placeholder}
        onChange={onChange}
      />
    );
  }
  const strValue = typeof value === "string" ? value : (value.fr ?? "");
  if (field.type === "textarea") {
    return <Textarea rows={2} value={strValue} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.type === "image") {
    return <ImageField label="" value={strValue} onChange={onChange} />;
  }
  if (field.type === "file") {
    return <FileField label="" value={strValue} onChange={onChange} />;
  }
  if (field.type === "select") {
    return (
      <Select value={strValue || (field.options?.[0]?.value ?? "")} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return <Input value={strValue} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function ObjectBlockAdmin({
  blockKey,
  title,
  description,
  fields,
  defaultValue,
}: {
  blockKey: string;
  title: string;
  description?: string;
  fields: BlockFieldDef[];
  defaultValue: BlockItem;
}) {
  const { data, loading } = useContentBlockRaw<BlockItem>(blockKey, defaultValue);
  if (loading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  return <ObjectBlockInner blockKey={blockKey} title={title} description={description} fields={fields} initialValue={data} />;
}

function ObjectBlockInner({
  blockKey,
  title,
  description,
  fields,
  initialValue,
}: {
  blockKey: string;
  title: string;
  description?: string;
  fields: BlockFieldDef[];
  initialValue: BlockItem;
}) {
  const [value, setValue] = useState<BlockItem>(initialValue);
  const [submitting, setSubmitting] = useState(false);

  async function enregistrer() {
    setSubmitting(true);
    try {
      await apiFetch(`/content-blocks/${blockKey}`, { method: "PUT", body: JSON.stringify({ value }) });
      toast.success("Contenu enregistré.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={cn("grid gap-1.5", (f.type === "textarea" || f.type === "image" || f.type === "file") && "sm:col-span-2")}>
            <Label className="text-xs">{f.label}</Label>
            <BlockFieldInput field={f} value={value[f.name] ?? ""} onChange={(v) => setValue((prev) => ({ ...prev, [f.name]: v }))} />
          </div>
        ))}
      </div>
      <Button type="button" size="sm" className="mt-5" disabled={submitting} onClick={enregistrer}>
        {submitting ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}

function ListBlockAdmin({
  blockKey,
  title,
  description,
  fields,
  defaultItems,
  itemLabel,
  emptyItem,
}: {
  blockKey: string;
  title: string;
  description?: string;
  fields: BlockFieldDef[];
  defaultItems: BlockItem[];
  itemLabel: (item: BlockItem, index: number) => string;
  emptyItem?: BlockItem;
}) {
  const { data, loading } = useContentBlockRaw<BlockItem[]>(blockKey, defaultItems);
  if (loading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  return (
    <ListBlockInner
      blockKey={blockKey}
      title={title}
      description={description}
      fields={fields}
      initialItems={data}
      itemLabel={itemLabel}
      emptyItem={emptyItem}
    />
  );
}

function ListBlockInner({
  blockKey,
  title,
  description,
  fields,
  initialItems,
  itemLabel,
  emptyItem,
}: {
  blockKey: string;
  title: string;
  description?: string;
  fields: BlockFieldDef[];
  initialItems: BlockItem[];
  itemLabel: (item: BlockItem, index: number) => string;
  emptyItem?: BlockItem;
}) {
  const [items, setItems] = useState<BlockItem[]>(initialItems);
  const [submitting, setSubmitting] = useState(false);

  function ajouter() {
    const nouveau = emptyItem ?? Object.fromEntries(fields.map((f) => [f.name, emptyBlockValue(f)]));
    setItems((prev) => [...prev, { ...nouveau }]);
  }

  function supprimer(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function modifier(index: number, name: string, v: BlockFieldValue) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [name]: v } : it)));
  }

  async function enregistrer() {
    // Une carte ajoutée puis jamais remplie ne doit pas être enregistrée :
    // en plus d'être inutile côté public, plusieurs cartes vides partagent
    // les mêmes clés React (toutes les valeurs à ""), ce qui casse le rendu.
    const nonVides = items.filter((it) => Object.values(it).some(blockValueIsFilled));
    setSubmitting(true);
    try {
      await apiFetch(`/content-blocks/${blockKey}`, { method: "PUT", body: JSON.stringify({ value: nonVides }) });
      toast.success("Contenu enregistré.");
      setItems(nonVides);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={ajouter}>
          + Ajouter
        </Button>
      </div>
      <div className="mt-5 space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{itemLabel(item, index)}</p>
              <RowActions onDelete={() => supprimer(index)} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name} className={cn("grid gap-1.5", (f.type === "textarea" || f.type === "image" || f.type === "file") && "sm:col-span-2")}>
                  <Label className="text-xs">{f.label}</Label>
                  <BlockFieldInput field={f} value={item[f.name] ?? ""} onChange={(v) => modifier(index, f.name, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Aucun élément. Cliquez sur « Ajouter ».</p>}
      </div>
      <Button type="button" size="sm" className="mt-5" disabled={submitting} onClick={enregistrer}>
        {submitting ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}

const ICONE_OPTIONS_ACCUEIL = [
  { value: "services", label: "Document (services)" },
  { value: "equipements", label: "Radio (équipements)" },
  { value: "marches", label: "Marteau (marchés)" },
  { value: "carrieres", label: "Mallette (carrières)" },
  { value: "reclamations", label: "Alerte (réclamations)" },
  { value: "statistiques", label: "Graphique (statistiques)" },
];

const ICONE_OPTIONS_AUTORITE = [
  { value: "scale", label: "Balance" },
  { value: "radio", label: "Radio" },
  { value: "users", label: "Utilisateurs" },
  { value: "shield", label: "Bouclier" },
  { value: "building", label: "Bâtiment" },
  { value: "trending", label: "Tendance" },
  { value: "mail", label: "Enveloppe" },
];

function ConsumerRightsDocumentAdmin() {
  const { data, loading, refetch } = useApiOne<{ fileUrl: string | null; updatedAt: string | null }>(
    "/consumer-rights-document",
  );
  const [uploading, setUploading] = useState(false);

  async function envoyer(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      await apiFetch("/consumer-rights-document", { method: "POST", body });
      toast.success("Guide mis à jour.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur d'envoi du fichier.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Guide des droits des consommateurs (PDF)</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Le bouton « Télécharger le guide » n'apparaît sur le site que si un fichier est envoyé ici.
      </p>
      {!loading && data?.fileUrl && (
        <a href={data.fileUrl} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-primary underline">
          Voir le guide actuel
        </a>
      )}
      <Input type="file" accept=".pdf" disabled={uploading} onChange={envoyer} className="mt-3" />
      {uploading && <p className="mt-1 text-xs text-muted-foreground">Envoi en cours…</p>}
    </div>
  );
}

function PagesPubliquesAdmin() {
  return (
    <div className="mt-8 space-y-10">
      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Accueil</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="home.hero"
            title="Bandeau d'accueil (hero)"
            description="Titre, texte et image affichés en haut de la page d'accueil."
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre principal", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
              { name: "image", label: "Image de fond", type: "image" },
            ]}
            defaultValue={{
              surtitre: { fr: "République de Guinée", en: "Republic of Guinea", ar: "جمهورية غينيا" },
              titre: {
                fr: "Réguler pour un secteur numérique fiable et accessible à tous",
                en: "Regulating for a reliable digital sector accessible to all",
                ar: "التنظيم من أجل قطاع رقمي موثوق ومتاح للجميع",
              },
              description: {
                fr: "L'ARPT encadre les marchés des postes et des télécommunications, protège les usagers et accompagne les opérateurs dans leurs démarches administratives.",
                en: "ARPT oversees the postal and telecommunications markets, protects users, and supports operators with their administrative procedures.",
                ar: "تشرف الهيئة على أسواق البريد والاتصالات، وتحمي المستخدمين، وترافق المشغلين في إجراءاتهم الإدارية.",
              },
              image: "/images/hero-arpt.jpg",
            }}
          />
          <ListBlockAdmin
            blockKey="home.quickLinks"
            title="Cartes d'accès rapide"
            description="Les raccourcis affichés juste sous le bandeau d'accueil."
            itemLabel={(it) => blockLabel(it.label) || "Nouvelle carte"}
            fields={[
              { name: "label", label: "Titre", type: "text", translatable: true },
              { name: "texte", label: "Texte", type: "text", translatable: true },
              { name: "to", label: "Lien (ex: /services)", type: "text" },
              { name: "icone", label: "Icône", type: "select", options: ICONE_OPTIONS_ACCUEIL },
            ]}
            defaultItems={[
              { to: "/services", label: { fr: "Démarches et services", en: "Procedures and services", ar: "الإجراءات والخدمات" }, icone: "services", texte: { fr: "Licences, homologations, fréquences", en: "Licenses, approvals, frequencies", ar: "التراخيص، الاعتمادات، الترددات" } },
              { to: "/equipements", label: { fr: "Équipements homologués", en: "Approved equipment", ar: "المعدات المعتمدة" }, icone: "equipements", texte: { fr: "Vérifier un terminal agréé", en: "Check an approved device", ar: "التحقق من جهاز معتمد" } },
              { to: "/appels-offres", label: { fr: "Appels d'offres", en: "Tenders", ar: "المناقصات" }, icone: "marches", texte: { fr: "Consulter les marchés en cours", en: "Browse ongoing contracts", ar: "تصفح الصفقات الجارية" } },
              { to: "/carrieres", label: { fr: "Carrières", en: "Careers", ar: "الوظائف" }, icone: "carrieres", texte: { fr: "Rejoindre l'Autorité", en: "Join the Authority", ar: "انضم إلى الهيئة" } },
              { to: "/reclamations", label: { fr: "Réclamations", en: "Complaints", ar: "الشكاوى" }, icone: "reclamations", texte: { fr: "Signaler un litige opérateur", en: "Report a dispute with an operator", ar: "الإبلاغ عن نزاع مع مشغل" } },
              { to: "/statistiques", label: { fr: "Observatoire", en: "Observatory", ar: "المرصد" }, icone: "statistiques", texte: { fr: "Chiffres clés du secteur", en: "Key sector figures", ar: "الأرقام الرئيسية للقطاع" } },
            ]}
          />
          <ListBlockAdmin
            blockKey="home.gallery"
            title="Galerie « En images »"
            description="Les photos affichées dans la section « En images » de l'accueil."
            itemLabel={(it) => blockLabel(it.titre) || "Nouvelle photo"}
            fields={[
              { name: "image", label: "Photo", type: "image" },
              { name: "categorie", label: "Catégorie", type: "text", translatable: true },
              { name: "titre", label: "Légende", type: "text", translatable: true },
            ]}
            defaultItems={[
              { image: "/images/hero-arpt.jpg", categorie: { fr: "Événements", en: "Events", ar: "الفعاليات" }, titre: { fr: "Participation de l'ARPT à une conférence internationale", en: "ARPT's participation in an international conference", ar: "مشاركة الهيئة في مؤتمر دولي" } },
              { image: "/images/group.jpeg", categorie: { fr: "Galerie", en: "Gallery", ar: "معرض الصور" }, titre: { fr: "Visite officielle à l'ARPT", en: "Official visit to ARPT", ar: "زيارة رسمية إلى الهيئة" } },
            ]}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">L'Autorité (À propos)</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="about.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "L'Autorité", en: "The Authority", ar: "السلطة" },
              titre: { fr: "Une institution au service d'un marché numérique équitable", en: "An institution serving a fair digital market", ar: "مؤسسة في خدمة سوق رقمي عادل" },
              description: { fr: "L'ARPT est l'autorité administrative indépendante chargée de la régulation des secteurs des postes et des télécommunications en République de Guinée.", en: "ARPT is the independent administrative authority responsible for regulating the postal and telecommunications sectors in the Republic of Guinea.", ar: "الهيئة هي السلطة الإدارية المستقلة المكلفة بتنظيم قطاعي البريد والاتصالات في جمهورية غينيا." },
            }}
          />
          <ObjectBlockAdmin
            blockKey="about.banner"
            title="Photo institutionnelle"
            description="Grande image affichée juste sous le bandeau d'introduction."
            fields={[
              { name: "image", label: "Image", type: "image" },
              { name: "phrase", label: "Phrase affichée sur l'image", type: "text", translatable: true },
            ]}
            defaultValue={{ image: "/images/hero-arpt.jpg", phrase: { fr: "Réguler les infrastructures qui connectent la Guinée", en: "Regulating the infrastructure that connects Guinea", ar: "تنظيم البنية التحتية التي تربط غينيا" } }}
          />
          <ObjectBlockAdmin
            blockKey="about.missionsImage"
            title="Image de la section « Nos missions »"
            fields={[{ name: "image", label: "Image", type: "image" }]}
            defaultValue={{ image: "/images/arpt/controle-qualite.jpg" }}
          />
          <ListBlockAdmin
            blockKey="about.missions"
            title="Nos missions"
            description="Les quatre responsabilités fondamentales affichées sur la page Autorité."
            itemLabel={(it) => blockLabel(it.titre) || "Nouvelle mission"}
            fields={[
              { name: "icone", label: "Icône", type: "select", options: ICONE_OPTIONS_AUTORITE },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "texte", label: "Texte", type: "textarea", translatable: true },
            ]}
            defaultItems={[
              { icone: "scale", titre: { fr: "Garantir une concurrence loyale", en: "Ensure fair competition", ar: "ضمان منافسة نزيهة" }, texte: { fr: "Surveiller les marchés, encadrer les tarifs d'interconnexion et prévenir les pratiques anticoncurrentielles.", en: "Monitor markets, regulate interconnection tariffs and prevent anti-competitive practices.", ar: "مراقبة الأسواق، وتأطير تعرفات الربط البيني، ومنع الممارسات المنافية للمنافسة." } },
              { icone: "radio", titre: { fr: "Gérer les ressources rares", en: "Manage scarce resources", ar: "إدارة الموارد النادرة" }, texte: { fr: "Planifier et attribuer le spectre radioélectrique ainsi que les ressources en numérotation.", en: "Plan and allocate the radio spectrum as well as numbering resources.", ar: "تخطيط وتوزيع الطيف الترددي وموارد الترقيم." } },
              { icone: "users", titre: { fr: "Protéger les consommateurs", en: "Protect consumers", ar: "حماية المستهلكين" }, texte: { fr: "Traiter les réclamations, contrôler la qualité de service et informer les usagers de leurs droits.", en: "Handle complaints, monitor service quality and inform users of their rights.", ar: "معالجة الشكاوى، ومراقبة جودة الخدمة، وإعلام المستخدمين بحقوقهم." } },
              { icone: "shield", titre: { fr: "Sécuriser le secteur", en: "Secure the sector", ar: "تأمين القطاع" }, texte: { fr: "Homologuer les équipements, contrôler les opérateurs et veiller au respect du cadre légal.", en: "Approve equipment, oversee operators and ensure compliance with the legal framework.", ar: "اعتماد المعدات، ومراقبة المشغلين، والسهر على احترام الإطار القانوني." } },
            ]}
          />
          <ListBlockAdmin
            blockKey="about.directions"
            title="Nos directions"
            description="L'organisation interne de l'Autorité."
            itemLabel={(it) => blockLabel(it.nom) || "Nouvelle direction"}
            fields={[
              { name: "icone", label: "Icône", type: "select", options: ICONE_OPTIONS_AUTORITE },
              { name: "nom", label: "Nom de la direction", type: "text", translatable: true },
              { name: "texte", label: "Texte", type: "textarea", translatable: true },
            ]}
            defaultItems={[
              { icone: "building", nom: { fr: "Direction générale", en: "General Management", ar: "الإدارة العامة" }, texte: { fr: "Pilotage stratégique, représentation institutionnelle et coordination de l'ensemble des directions.", en: "Strategic direction, institutional representation and coordination of all departments.", ar: "القيادة الاستراتيجية والتمثيل المؤسسي وتنسيق جميع المديريات." } },
              { icone: "radio", nom: { fr: "Direction technique et du spectre", en: "Technical and Spectrum Department", ar: "المديرية التقنية والطيف" }, texte: { fr: "Planification des fréquences, contrôle du spectre et homologation des équipements radioélectriques.", en: "Frequency planning, spectrum monitoring and approval of radio equipment.", ar: "تخطيط الترددات، ومراقبة الطيف، واعتماد الأجهزة اللاسلكية." } },
              { icone: "scale", nom: { fr: "Direction des affaires juridiques", en: "Legal Affairs Department", ar: "مديرية الشؤون القانونية" }, texte: { fr: "Élaboration des textes réglementaires, avis juridiques et suivi des contentieux sectoriels.", en: "Drafting of regulatory texts, legal opinions and monitoring of sector disputes.", ar: "إعداد النصوص التنظيمية، وإبداء الآراء القانونية، ومتابعة النزاعات القطاعية." } },
              { icone: "users", nom: { fr: "Direction des consommateurs", en: "Consumer Department", ar: "مديرية المستهلكين" }, texte: { fr: "Traitement des réclamations des usagers et actions de sensibilisation sur leurs droits.", en: "Handling user complaints and awareness actions on their rights.", ar: "معالجة شكاوى المستخدمين وأنشطة التوعية بحقوقهم." } },
              { icone: "trending", nom: { fr: "Direction de l'économie et des marchés", en: "Economics and Markets Department", ar: "مديرية الاقتصاد والأسواق" }, texte: { fr: "Analyse tarifaire, observatoire du secteur et surveillance de la concurrence entre opérateurs.", en: "Tariff analysis, sector observatory and monitoring of competition between operators.", ar: "تحليل التعرفات، ومرصد القطاع، ومراقبة المنافسة بين المشغلين." } },
              { icone: "mail", nom: { fr: "Direction du secteur postal", en: "Postal Sector Department", ar: "مديرية القطاع البريدي" }, texte: { fr: "Régulation, autorisation et développement des activités postales et de courrier express.", en: "Regulation, authorization and development of postal and express mail activities.", ar: "تنظيم وترخيص وتطوير أنشطة البريد والبريد السريع." } },
            ]}
          />
          <ListBlockAdmin
            blockKey="about.timeline"
            title="Repères — dates clés"
            itemLabel={(it) => blockLabel(it.annee) || "Nouvelle date"}
            fields={[
              { name: "annee", label: "Année", type: "text" },
              { name: "texte", label: "Texte", type: "text", translatable: true },
            ]}
            defaultItems={[
              { annee: "2005", texte: { fr: "Création de l'Autorité de régulation du secteur.", en: "Creation of the sector's regulatory Authority.", ar: "إنشاء هيئة تنظيم القطاع." } },
              { annee: "2015", texte: { fr: "Adoption de la loi L/2015/018/AN sur les télécommunications et les TIC.", en: "Adoption of Law L/2015/018/AN on telecommunications and ICT.", ar: "اعتماد القانون L/2015/018/AN المتعلق بالاتصالات وتكنولوجيا المعلومات." } },
              { annee: "2016", texte: { fr: "Nouvelle organisation de l'ARPT par décret présidentiel.", en: "New organization of ARPT by presidential decree.", ar: "تنظيم جديد للهيئة بموجب مرسوم رئاسي." } },
              { annee: "2026", texte: { fr: "Lancement du chantier d'attribution des fréquences 5G.", en: "Launch of the 5G frequency allocation project.", ar: "إطلاق ورش توزيع ترددات الجيل الخامس." } },
            ]}
          />
          <ObjectBlockAdmin
            blockKey="about.teamImage"
            title="Photo d'équipe"
            fields={[{ name: "image", label: "Image", type: "image" }]}
            defaultValue={{ image: "/images/group.jpeg" }}
          />
          <ListBlockAdmin
            blockKey="about.council"
            title="Direction générale — membres"
            description="Le carrousel des responsables affiché sur la page Autorité."
            itemLabel={(it) => blockLabel(it.name) || "Nouveau membre"}
            fields={[
              { name: "name", label: "Nom", type: "text" },
              { name: "role", label: "Fonction", type: "text", translatable: true },
              { name: "image", label: "Photo", type: "image" },
            ]}
            defaultItems={[
              { name: "M. Mamady Doumbouya", role: { fr: "Directeur général", en: "Director General", ar: "المدير العام" }, image: "/images/arpt/mamady-doumbouya.jpeg" },
              { name: "M. Adama Condé", role: { fr: "Directeur général adjoint", en: "Deputy Director General", ar: "نائب المدير العام" }, image: "/images/arpt/adama-conde.jpg" },
              { name: "M. Fany Zeze Camara", role: { fr: "Membre", en: "Member", ar: "عضو" }, image: "/images/arpt/zeze.jpeg" },
            ]}
          />
          <ObjectBlockAdmin
            blockKey="about.support"
            title="Encart « Besoin d'un accompagnement ? »"
            description="Le téléphone et l'email affichés proviennent de la Configuration du site."
            fields={[{ name: "description", label: "Texte", type: "textarea", translatable: true }]}
            defaultValue={{
              description: {
                fr: "Notre équipe vous oriente vers le bon service pour vos démarches, vos réclamations et vos questions réglementaires.",
                en: "Our team directs you to the right department for your procedures, complaints and regulatory questions.",
                ar: "يوجهكم فريقنا إلى المصلحة المناسبة لإجراءاتكم وشكاواكم وأسئلتكم التنظيمية.",
              },
            }}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Réclamations</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="claims.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Protection des consommateurs", en: "Consumer protection", ar: "حماية المستهلك" },
              titre: { fr: "Déposer une réclamation", en: "File a complaint", ar: "تقديم شكوى" },
              description: { fr: "L'ARPT reçoit et instruit les litiges opposant les usagers aux opérateurs de télécommunications et aux opérateurs postaux.", en: "ARPT receives and investigates disputes between users and telecommunications or postal operators.", ar: "تتلقى الهيئة وتحقق في النزاعات بين المستخدمين ومشغلي الاتصالات والبريد." },
            }}
          />
          <ListBlockAdmin
            blockKey="claims.steps"
            title="Étapes avant de saisir l'Autorité"
            itemLabel={(it, i) => `Étape ${i + 1}`}
            fields={[{ name: "texte", label: "Texte", type: "textarea", translatable: true }]}
            defaultItems={[
              { texte: { fr: "Contactez d'abord le service client de votre opérateur et conservez la référence du dossier.", en: "First contact your operator's customer service and keep the case reference.", ar: "اتصل أولاً بخدمة عملاء مشغلك واحتفظ بمرجع الملف." } },
              { texte: { fr: "Si aucune réponse satisfaisante n'est apportée sous 30 jours, saisissez l'ARPT via ce formulaire.", en: "If no satisfactory response is given within 30 days, contact ARPT via this form.", ar: "إذا لم تحصل على رد مُرضٍ خلال 30 يوماً، توجه إلى الهيئة عبر هذه الاستمارة." } },
              { texte: { fr: "Un agent instruit votre dossier et vous informe de l'avancement depuis votre portail usager.", en: "An agent processes your case and keeps you informed of its progress via your user portal.", ar: "يتولى أحد الأعوان معالجة ملفك ويطلعك على تقدمه عبر بوابة المستخدم." } },
            ]}
          />
          <ListBlockAdmin
            blockKey="claims.operators"
            title="Opérateurs concernés"
            description="La liste déroulante « Opérateur concerné » du formulaire."
            itemLabel={(it) => blockLabel(it.label) || "Nouvel opérateur"}
            fields={[
              { name: "value", label: "Identifiant (sans espace)", type: "text" },
              { name: "label", label: "Nom affiché", type: "text", translatable: true },
            ]}
            defaultItems={[
              { value: "orange", label: { fr: "Orange Guinée", en: "Orange Guinée", ar: "Orange Guinée" } },
              { value: "mtn", label: { fr: "MTN Guinée", en: "MTN Guinée", ar: "MTN Guinée" } },
              { value: "cellcom", label: { fr: "Cellcom", en: "Cellcom", ar: "Cellcom" } },
              { value: "poste", label: { fr: "Guinée Poste", en: "Guinea Post", ar: "بريد غينيا" } },
              { value: "autre", label: { fr: "Autre opérateur", en: "Other operator", ar: "مشغل آخر" } },
            ]}
          />
          <ObjectBlockAdmin
            blockKey="claims.guide"
            title="Encart « Droits des consommateurs »"
            fields={[
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Texte", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              titre: { fr: "Droits des consommateurs", en: "Consumer rights", ar: "حقوق المستهلك" },
              description: {
                fr: "Guide officiel des droits et recours des usagers des services de télécommunications.",
                en: "Official guide to the rights and remedies of telecommunications service users.",
                ar: "الدليل الرسمي لحقوق وسبل انتصاف مستخدمي خدمات الاتصالات.",
              },
            }}
          />
          <ConsumerRightsDocumentAdmin />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Réglementation</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="regulation.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Ressources", en: "Resources", ar: "الموارد" },
              titre: { fr: "Cadre réglementaire du secteur", en: "Sector regulatory framework", ar: "الإطار التنظيمي للقطاع" },
              description: { fr: "Consultez et téléchargez l'ensemble des textes en vigueur applicables aux postes et aux télécommunications.", en: "Browse and download all texts currently in force applicable to posts and telecommunications.", ar: "اطّلع على جميع النصوص السارية المطبقة على البريد والاتصالات وقم بتحميلها." },
            }}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Équipements</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="equipment.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Registre public", en: "Public register", ar: "السجل العمومي" },
              titre: { fr: "Équipements et terminaux homologués", en: "Approved equipment and terminals", ar: "المعدات والأجهزة المعتمدة" },
              description: { fr: "Avant tout achat ou importation, vérifiez le statut d'homologation d'un équipement radioélectrique auprès de l'ARPT.", en: "Before any purchase or import, check the approval status of a radio equipment with ARPT.", ar: "قبل أي شراء أو استيراد، تحقق من حالة اعتماد الجهاز اللاسلكي لدى الهيئة." },
            }}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Appels d'offres</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="tenders.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Marchés publics", en: "Public procurement", ar: "الصفقات العمومية" },
              titre: { fr: "Appels d'offres de l'Autorité", en: "Authority tenders", ar: "مناقصات الهيئة" },
              description: { fr: "Les avis publiés ci-dessous précisent l'objet du marché, le budget prévisionnel et la date limite de dépôt des plis.", en: "The notices published below specify the subject of the contract, the estimated budget and the submission deadline.", ar: "توضح الإعلانات المنشورة أدناه موضوع الصفقة والميزانية التقديرية والموعد النهائي لإيداع الملفات." },
            }}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Carrières</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="careers.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Rejoindre l'Autorité", en: "Join the Authority", ar: "انضم إلى الهيئة" },
              titre: { fr: "Carrières à l'ARPT", en: "Careers at ARPT", ar: "الوظائف في الهيئة" },
              description: { fr: "L'Autorité recrute des profils techniques, juridiques et économiques engagés au service du secteur numérique guinéen.", en: "The Authority recruits technical, legal and economic profiles committed to serving Guinea's digital sector.", ar: "تعمل الهيئة على توظيف كفاءات تقنية وقانونية واقتصادية ملتزمة بخدمة القطاع الرقمي الغيني." },
            }}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Actualités</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="news.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Salle de presse", en: "Press room", ar: "غرفة الصحافة" },
              titre: { fr: "Actualités et communiqués", en: "News and press releases", ar: "الأخبار والبلاغات" },
              description: {
                fr: "Suivez les décisions, les publications et les événements de l'Autorité.",
                en: "Follow the Authority's decisions, publications and events.",
                ar: "تابع قرارات الهيئة ومنشوراتها وفعالياتها.",
              },
            }}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Services</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="services.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Démarches", en: "Procedures", ar: "الإجراءات" },
              titre: { fr: "Services aux opérateurs, entreprises et particuliers", en: "Services for operators, businesses and individuals", ar: "خدمات للمشغلين والشركات والأفراد" },
              description: { fr: "Pour chaque service, retrouvez les pièces exigées, le délai d'instruction et le coût applicable. Les demandes se déposent en ligne depuis le portail usager.", en: "For each service, find the required documents, processing time and applicable cost. Requests are submitted online via the user portal.", ar: "لكل خدمة، تجد الوثائق المطلوبة ومدة المعالجة والتكلفة المطبقة. تُقدَّم الطلبات عبر الإنترنت من خلال بوابة المستخدم." },
            }}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contact</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="contact.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Contact", en: "Contact", ar: "اتصل بنا" },
              titre: { fr: "Nous écrire", en: "Write to us", ar: "راسلنا" },
              description: { fr: "Une question sur une démarche, un texte réglementaire ou un dossier en cours ? Nos services vous répondent sous cinq jours ouvrés.", en: "A question about a procedure, a regulatory text or an ongoing case? Our teams respond within five business days.", ar: "هل لديك سؤال حول إجراء أو نص تنظيمي أو ملف قيد المعالجة؟ تجيبكم مصالحنا خلال خمسة أيام عمل." },
            }}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Statistiques</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="statistics.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Observatoire", en: "Observatory", ar: "المرصد" },
              titre: { fr: "Statistiques du secteur", en: "Sector statistics", ar: "إحصائيات القطاع" },
              description: { fr: "Indicateurs mensuels et trimestriels consolidés par l'Autorité à partir des déclarations des opérateurs.", en: "Monthly and quarterly indicators consolidated by the Authority from operator filings.", ar: "مؤشرات شهرية وفصلية جمعتها الهيئة من تصريحات المشغلين." },
            }}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Consultations publiques</p>
        <div className="mt-3 space-y-5">
          <ObjectBlockAdmin
            blockKey="consultations.hero"
            title="Bandeau d'introduction"
            fields={[
              { name: "surtitre", label: "Surtitre", type: "text", translatable: true },
              { name: "titre", label: "Titre", type: "text", translatable: true },
              { name: "description", label: "Description", type: "textarea", translatable: true },
            ]}
            defaultValue={{
              surtitre: { fr: "Participation", en: "Participation", ar: "المشاركة" },
              titre: { fr: "Consultations publiques", en: "Public consultations", ar: "الاستشارات العمومية" },
              description: { fr: "Avant l'adoption d'un texte structurant, l'Autorité recueille les observations des opérateurs, des associations de consommateurs et du public.", en: "Before adopting a major text, the Authority gathers input from operators, consumer associations and the public.", ar: "قبل اعتماد نص هيكلي، تجمع الهيئة ملاحظات المشغلين وجمعيات المستهلكين والجمهور." },
            }}
          />
        </div>
      </section>
    </div>
  );
}

interface NewsAdmin {
  id: number;
  uid: string;
  title: string;
  content: string;
  category: string | null;
  isPublished: boolean;
  views: number;
  imageUrl: string | null;
  createdAt: string;
}

function ActualitesAdmin() {
  const { data: news, loading, error, refetch } = useApiList<NewsAdmin>("/news?lang=fr&pageSize=100");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsAdmin | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function ouvrirCreation() {
    setEditing(null);
    setIsPublished(true);
    setShowForm((v) => !v);
  }

  function ouvrirEdition(n: NewsAdmin) {
    setEditing(n);
    setIsPublished(n.isPublished);
    setShowForm(true);
  }

  async function supprimer(n: NewsAdmin) {
    if (!window.confirm(`Supprimer l'actualité "${n.title}" ?`)) return;
    try {
      await apiFetch(`/news/${n.id}`, { method: "DELETE" });
      toast.success("Actualité supprimée.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = new FormData(event.currentTarget);
    const image = form.get("image") as File;
    if (!editing && (!image || image.size === 0)) {
      setFormError("Une image est obligatoire.");
      return;
    }
    setSubmitting(true);
    const body = new FormData();
    body.append("titleFr", String(form.get("titleFr")));
    body.append("contentFr", String(form.get("contentFr")));
    body.append("category", String(form.get("category") || ""));
    body.append("isPublished", String(isPublished));
    if (image && image.size > 0) body.append("image", image);

    try {
      if (editing) {
        await apiFetch(`/news/${editing.id}`, { method: "PATCH", body });
        toast.success("Actualité modifiée.");
      } else {
        await apiFetch("/news", { method: "POST", body });
        toast.success("Actualité créée.");
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{news.length} actualité(s)</p>
        <Button size="sm" onClick={ouvrirCreation}>
          {showForm && !editing ? "Annuler" : "+ Nouvelle actualité"}
        </Button>
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">{editing ? `Modifier "${editing.title}"` : "Nouvelle actualité"}</p>
          <div className="grid gap-2">
            <Label htmlFor="news-title">Titre *</Label>
            <Input id="news-title" name="titleFr" required defaultValue={editing?.title} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="news-content">Contenu *</Label>
            <Textarea id="news-content" name="contentFr" required rows={6} defaultValue={editing?.content} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="news-category">Catégorie</Label>
            <Input id="news-category" name="category" placeholder="Ex. : Réglementation, Appels d'offres, Événement…" defaultValue={editing?.category ?? ""} />
          </div>
          {editing?.imageUrl && (
            <img src={editing.imageUrl} alt="" className="h-32 w-auto rounded-lg border border-border object-cover" />
          )}
          <div className="grid gap-2">
            <Label htmlFor="news-image">Image {editing ? "(laisser vide pour conserver l'actuelle)" : "*"}</Label>
            <Input id="news-image" name="image" type="file" accept="image/*" required={!editing} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Publier immédiatement
          </label>
          {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer l'actualité"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      )}

      <TableauAdmin
        codeColumn={false}
        colonnes={["Titre", "Catégorie", "Date", "Vues", "État", "Actions"]}
        lignes={news.map((n) => [
          n.title,
          n.category ?? "—",
          formaterDate(n.createdAt),
          n.views.toLocaleString("fr-FR"),
          n.isPublished ? <Puce key={n.id} label="Publié" tone="success" /> : <Puce key={n.id} label="Brouillon" tone="warning" />,
          <RowActions key={n.id} onEdit={() => ouvrirEdition(n)} onDelete={() => supprimer(n)} />,
        ])}
      />
    </div>
  );
}

interface CommuniqueAdmin {
  id: number;
  uid: string;
  title: string;
  content: string;
  fileUrl: string | null;
  createdAt: string;
}

function CommuniquesAdmin() {
  const { data: communiques, loading, error, refetch } = useApiList<CommuniqueAdmin>("/communiques?lang=fr&pageSize=100");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CommuniqueAdmin | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function ouvrirCreation() {
    setEditing(null);
    setShowForm((v) => !v);
  }

  function ouvrirEdition(c: CommuniqueAdmin) {
    setEditing(c);
    setShowForm(true);
  }

  async function supprimer(c: CommuniqueAdmin) {
    if (!window.confirm(`Supprimer le communiqué "${c.title}" ?`)) return;
    try {
      await apiFetch(`/communiques/${c.id}`, { method: "DELETE" });
      toast.success("Communiqué supprimé.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    body.append("titleFr", String(form.get("titleFr")));
    body.append("contentFr", String(form.get("contentFr")));
    const fichier = form.get("file") as File;
    if (fichier && fichier.size > 0) body.append("file", fichier);

    try {
      if (editing) {
        await apiFetch(`/communiques/${editing.id}`, { method: "PATCH", body });
        toast.success("Communiqué modifié.");
      } else {
        await apiFetch("/communiques", { method: "POST", body });
        toast.success("Communiqué créé.");
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{communiques.length} communiqué(s)</p>
        <Button size="sm" onClick={ouvrirCreation}>
          {showForm && !editing ? "Annuler" : "+ Nouveau communiqué"}
        </Button>
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">{editing ? `Modifier "${editing.title}"` : "Nouveau communiqué"}</p>
          <div className="grid gap-2">
            <Label htmlFor="com-title">Titre *</Label>
            <Input id="com-title" name="titleFr" required defaultValue={editing?.title} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="com-content">Contenu *</Label>
            <Textarea id="com-content" name="contentFr" required rows={5} defaultValue={editing?.content} />
          </div>
          {editing?.fileUrl && (
            <a href={editing.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
              Voir le document actuel
            </a>
          )}
          <div className="grid gap-2">
            <Label htmlFor="com-file">Document joint (PDF, {editing ? "laisser vide pour conserver l'actuel" : "facultatif"})</Label>
            <Input id="com-file" name="file" type="file" accept=".pdf" />
          </div>
          {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer le communiqué"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      )}

      <TableauAdmin
        codeColumn={false}
        colonnes={["Titre", "Date", "Actions"]}
        lignes={communiques.map((c) => [
          c.title,
          formaterDate(c.createdAt),
          <RowActions key={c.id} onEdit={() => ouvrirEdition(c)} onDelete={() => supprimer(c)} />,
        ])}
      />
    </div>
  );
}

interface ServiceAdmin {
  id: number;
  uid: string;
  name: string;
  description: string | null;
  delai: string | null;
  requiredDocuments: string[];
  cost: number | null;
  isActive: boolean;
  imageUrl: string | null;
  fileUrl: string | null;
}

function ServicesAdmin() {
  const { data: services, loading, error, refetch } = useApiList<ServiceAdmin>("/services?lang=fr&pageSize=100");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceAdmin | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function ouvrirCreation() {
    setEditing(null);
    setIsActive(true);
    setShowForm((v) => !v);
  }

  function ouvrirEdition(s: ServiceAdmin) {
    setEditing(s);
    setIsActive(s.isActive);
    setShowForm(true);
  }

  async function supprimer(s: ServiceAdmin) {
    if (!window.confirm(`Supprimer le service "${s.name}" ?`)) return;
    try {
      await apiFetch(`/services/${s.id}`, { method: "DELETE" });
      toast.success("Service supprimé.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    body.append("nameFr", String(form.get("nameFr")));
    if (form.get("descriptionFr")) body.append("descriptionFr", String(form.get("descriptionFr")));
    if (form.get("delaiFr")) body.append("delaiFr", String(form.get("delaiFr")));
    if (form.get("cost")) body.append("cost", String(form.get("cost")));
    body.append("isActive", String(isActive));
    const documentsRaw = String(form.get("requiredDocuments") ?? "").trim();
    if (documentsRaw) body.append("requiredDocuments", documentsRaw);
    const image = form.get("image") as File;
    if (image && image.size > 0) body.append("image", image);
    const fichier = form.get("file") as File;
    if (fichier && fichier.size > 0) body.append("file", fichier);

    try {
      if (editing) {
        await apiFetch(`/services/${editing.id}`, { method: "PATCH", body });
        toast.success("Service modifié.");
      } else {
        await apiFetch("/services", { method: "POST", body });
        toast.success("Service créé.");
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{services.length} service(s)</p>
        <Button size="sm" onClick={ouvrirCreation}>
          {showForm && !editing ? "Annuler" : "+ Nouveau service"}
        </Button>
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? `Modifier "${editing.name}"` : "Nouveau service"}</p>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="svc-name">Nom du service *</Label>
            <Input id="svc-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="svc-description">Description</Label>
            <Textarea id="svc-description" name="descriptionFr" rows={3} defaultValue={editing?.description ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-delai">Délai de traitement</Label>
            <Input id="svc-delai" name="delaiFr" placeholder="Ex. : 5 jours ouvrés" defaultValue={editing?.delai ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-cost">Coût (GNF)</Label>
            <Input id="svc-cost" name="cost" type="number" placeholder="Facultatif" defaultValue={editing?.cost ?? ""} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="svc-documents">Documents requis (séparés par des virgules)</Label>
            <Input
              id="svc-documents"
              name="requiredDocuments"
              placeholder="Ex. : Pièce d'identité, Justificatif de domicile"
              defaultValue={(editing?.requiredDocuments ?? []).join(", ")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-image">Image {editing ? "(laisser vide pour conserver l'actuelle)" : "(facultatif)"}</Label>
            <Input id="svc-image" name="image" type="file" accept="image/*" />
            {editing?.imageUrl && (
              <img src={editing.imageUrl} alt="" className="mt-1 h-20 w-auto rounded-lg border border-border object-cover" />
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-file">Formulaire à télécharger (PDF, {editing ? "laisser vide pour conserver l'actuel" : "facultatif"})</Label>
            <Input id="svc-file" name="file" type="file" accept=".pdf" />
            {editing?.fileUrl && (
              <a href={editing.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                Voir le fichier actuel
              </a>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Service actif
          </label>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer le service"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      )}

      <TableauAdmin
        codeColumn={false}
        colonnes={["Service", "Délai", "État", "Actions"]}
        lignes={services.map((s) => [
          s.name,
          s.delai ?? "—",
          s.isActive ? <Puce key={s.id} label="Actif" tone="success" /> : <Puce key={s.id} label="Inactif" tone="warning" />,
          <RowActions key={s.id} onEdit={() => ouvrirEdition(s)} onDelete={() => supprimer(s)} />,
        ])}
      />
    </div>
  );
}

interface ContactMessageAdmin {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  isArchived: boolean;
}

function MessageRow({ message, onUpdated }: { message: ContactMessageAdmin; onUpdated: () => void }) {
  const [showReply, setShowReply] = useState(false);
  const [reponse, setReponse] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  async function envoyer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reponse.trim().length < 1) return;
    setError("");
    setSending(true);
    try {
      await apiFetch(`/contact-messages/${message.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ replyMessage: reponse }),
      });
      toast.success("Réponse envoyée par email.");
      setShowReply(false);
      setReponse("");
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSending(false);
    }
  }

  async function toggle(field: "isRead" | "isArchived") {
    setToggling(true);
    try {
      await apiFetch(`/contact-messages/${message.id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: !message[field] }),
      });
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {message.name} <span className="font-normal text-muted-foreground">({message.email})</span>
          </p>
          <p className="mt-0.5 text-sm">{message.subject}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formaterDate(message.createdAt)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {message.isArchived ? (
            <Puce label="Archivé" tone="info" />
          ) : message.isRead ? (
            <Puce label="Lu" tone="success" />
          ) : (
            <Puce label="Non lu" tone="warning" />
          )}
        </div>
      </div>

      <p className="mt-3 rounded-md bg-surface p-3 text-sm text-muted-foreground">{message.message}</p>

      <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
        <button onClick={() => setShowReply((v) => !v)} className="text-primary hover:underline">
          {showReply ? "Annuler" : "Répondre"}
        </button>
        <button onClick={() => toggle("isRead")} disabled={toggling} className="text-muted-foreground hover:underline disabled:opacity-50">
          Marquer {message.isRead ? "non lu" : "lu"}
        </button>
        <button onClick={() => toggle("isArchived")} disabled={toggling} className="text-muted-foreground hover:underline disabled:opacity-50">
          {message.isArchived ? "Désarchiver" : "Archiver"}
        </button>
      </div>

      {showReply && (
        <form onSubmit={envoyer} className="mt-3 grid gap-2">
          <Textarea
            value={reponse}
            onChange={(e) => setReponse(e.target.value)}
            rows={4}
            required
            placeholder={`Répondre à ${message.name}…`}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={sending} className="justify-self-start">
            {sending ? "Envoi…" : "Envoyer la réponse par email"}
          </Button>
        </form>
      )}
    </div>
  );
}

function MessagesAdmin() {
  const { data: messages, loading, error, refetch } = useApiList<ContactMessageAdmin>("/contact-messages?pageSize=100");

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8 rounded-xl border border-border bg-card px-5">
      {messages.map((m) => (
        <MessageRow key={m.id} message={m} onUpdated={refetch} />
      ))}
      {messages.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucun message pour l'instant.</p>
      )}
    </div>
  );
}

interface ReglementationAdmin {
  id: number;
  uid: string;
  name: string;
  description: string | null;
  category: string;
  format: string;
  isPopular: boolean;
  dateUpload: string;
  views: number;
  fileUrl: string | null;
}

function ReglementationAdmin() {
  const { data: textes, loading, error, refetch } = useApiList<ReglementationAdmin>("/regulations?lang=fr&pageSize=100");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ReglementationAdmin | null>(null);
  const [description, setDescription] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function ouvrirCreation() {
    setEditing(null);
    setDescription("");
    setIsPopular(false);
    setShowForm((v) => !v);
  }

  function ouvrirEdition(t: ReglementationAdmin) {
    setEditing(t);
    setDescription(t.description ?? "");
    setIsPopular(t.isPopular);
    setShowForm(true);
  }

  async function supprimer(t: ReglementationAdmin) {
    if (!window.confirm(`Supprimer le texte "${t.name}" ?`)) return;
    try {
      await apiFetch(`/regulations/${t.id}`, { method: "DELETE" });
      toast.success("Texte réglementaire supprimé.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = new FormData(event.currentTarget);
    const fichier = form.get("file") as File;
    if (!editing && (!fichier || fichier.size === 0)) {
      setFormError("Le fichier du texte est obligatoire.");
      return;
    }
    setSubmitting(true);
    const body = new FormData();
    body.append("nameFr", String(form.get("nameFr")));
    body.append("descriptionFr", description);
    body.append("category", String(form.get("category")));
    body.append("dateUpload", String(form.get("dateUpload")));
    body.append("isPopular", String(isPopular));
    if (fichier && fichier.size > 0) body.append("file", fichier);

    try {
      if (editing) {
        await apiFetch(`/regulations/${editing.id}`, { method: "PATCH", body });
        toast.success("Texte réglementaire modifié.");
      } else {
        await apiFetch("/regulations", { method: "POST", body });
        toast.success("Texte réglementaire créé.");
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{textes.length} texte(s)</p>
        <Button size="sm" onClick={ouvrirCreation}>
          {showForm && !editing ? "Annuler" : "+ Nouveau texte"}
        </Button>
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? `Modifier "${editing.name}"` : "Nouveau texte réglementaire"}</p>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="reg-name">Nom du texte *</Label>
            <Input id="reg-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="reg-description">Description</Label>
            <Textarea
              id="reg-description"
              rows={3}
              placeholder="Résumé en 2 à 3 lignes du contenu de ce texte, affiché aux usagers sur la page Réglementation."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="rounded-lg border border-dashed border-border bg-surface p-3">
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Aperçu sur le site</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {description || <span className="italic text-muted-foreground/60">Aucune description saisie pour l'instant.</span>}
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reg-category">Catégorie *</Label>
            <Input id="reg-category" name="category" required placeholder="Ex. : Loi, Décret, Arrêté…" defaultValue={editing?.category} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reg-date">Date de publication *</Label>
            <Input id="reg-date" name="dateUpload" type="date" required defaultValue={editing?.dateUpload?.slice(0, 10)} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} />
            Mettre en avant dans « Textes les plus consultés » (page d'accueil)
          </label>
          {editing?.fileUrl && (
            <a href={editing.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline sm:col-span-2">
              Voir le fichier actuel
            </a>
          )}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="reg-file">Fichier (PDF) {editing ? "(laisser vide pour conserver l'actuel)" : "*"}</Label>
            <Input id="reg-file" name="file" type="file" accept=".pdf" required={!editing} />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer le texte"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      )}

      <TableauAdmin
        codeColumn={false}
        colonnes={["Texte", "Catégorie", "Format", "Publié le", "Vues", "Actions"]}
        lignes={textes.map((t) => [
          t.name,
          t.category,
          t.format,
          formaterDate(t.dateUpload),
          t.views.toLocaleString("fr-FR"),
          <RowActions key={t.id} onEdit={() => ouvrirEdition(t)} onDelete={() => supprimer(t)} />,
        ])}
      />
    </div>
  );
}

interface ConsultationAdmin {
  id: number;
  uid: string;
  title: string;
  description: string;
  status: "OUVERTE" | "CLOTUREE";
  startDate: string;
  endDate: string;
  contactEmail: string;
  fileUrl: string | null;
}

function ConsultationsAdmin() {
  const { data: consultations, loading, error, refetch } = useApiList<ConsultationAdmin>(
    "/public-consultations?lang=fr&pageSize=100",
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ConsultationAdmin | null>(null);
  const [status, setStatus] = useState<string>("OUVERTE");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function ouvrirCreation() {
    setEditing(null);
    setStatus("OUVERTE");
    setShowForm((v) => !v);
  }

  function ouvrirEdition(c: ConsultationAdmin) {
    setEditing(c);
    setStatus(c.status);
    setShowForm(true);
  }

  async function supprimer(c: ConsultationAdmin) {
    if (!window.confirm(`Supprimer la consultation "${c.title}" ?`)) return;
    try {
      await apiFetch(`/public-consultations/${c.id}`, { method: "DELETE" });
      toast.success("Consultation publique supprimée.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    body.append("titleFr", String(form.get("titleFr")));
    body.append("descriptionFr", String(form.get("descriptionFr")));
    body.append("status", status);
    body.append("startDate", String(form.get("startDate")));
    body.append("endDate", String(form.get("endDate")));
    body.append("contactEmail", String(form.get("contactEmail")));
    const fichier = form.get("file") as File;
    if (fichier && fichier.size > 0) body.append("file", fichier);

    try {
      if (editing) {
        await apiFetch(`/public-consultations/${editing.id}`, { method: "PATCH", body });
        toast.success("Consultation publique modifiée.");
      } else {
        await apiFetch("/public-consultations", { method: "POST", body });
        toast.success("Consultation publique créée.");
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{consultations.length} consultation(s)</p>
        <Button size="sm" onClick={ouvrirCreation}>
          {showForm && !editing ? "Annuler" : "+ Nouvelle consultation"}
        </Button>
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? `Modifier "${editing.title}"` : "Nouvelle consultation publique"}</p>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cons-title">Titre *</Label>
            <Input id="cons-title" name="titleFr" required defaultValue={editing?.title} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cons-description">Description *</Label>
            <Textarea id="cons-description" name="descriptionFr" required rows={3} defaultValue={editing?.description} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cons-status">Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="cons-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSULTATION_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "OUVERTE" ? "Ouverte" : "Clôturée"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cons-start">Date de début *</Label>
            <Input id="cons-start" name="startDate" type="date" required defaultValue={editing?.startDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cons-end">Date de fin *</Label>
            <Input id="cons-end" name="endDate" type="date" required defaultValue={editing?.endDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cons-email">Email de contact *</Label>
            <Input id="cons-email" name="contactEmail" type="email" required defaultValue={editing?.contactEmail} />
          </div>
          {editing?.fileUrl && (
            <a href={editing.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline sm:col-span-2">
              Voir le document actuel
            </a>
          )}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cons-file">Document joint (PDF, {editing ? "laisser vide pour conserver l'actuel" : "facultatif"})</Label>
            <Input id="cons-file" name="file" type="file" accept=".pdf" />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer la consultation"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      )}

      <TableauAdmin
        codeColumn={false}
        colonnes={["Consultation", "Période", "Statut", "Actions"]}
        lignes={consultations.map((c) => [
          c.title,
          `${formaterDate(c.startDate)} → ${formaterDate(c.endDate)}`,
          <StatutBadge key={c.uid} statut={c.status} />,
          <RowActions key={c.id} onEdit={() => ouvrirEdition(c)} onDelete={() => supprimer(c)} />,
        ])}
      />
    </div>
  );
}

interface UserAdmin {
  id: number;
  email: string;
  fullname: string;
  role: { id: number; name: string } | null;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  dateJoined: string;
}

interface RoleOption {
  id: number;
  name: string;
}

interface RoleAdmin {
  id: number;
  name: string;
  permissions: { id: number; name: string; action: string }[];
}

interface PermissionOption {
  id: number;
  name: string;
  action: string;
}

function UserRoleSelect({ user, roles, onUpdated }: { user: UserAdmin; roles: RoleOption[]; onUpdated: () => void }) {
  const [pending, setPending] = useState(false);

  async function changer(value: string) {
    setPending(true);
    try {
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ roleId: value === "none" ? null : Number(value) }),
      });
      toast.success("Rôle mis à jour.");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    } finally {
      setPending(false);
    }
  }

  if (user.isSuperuser) {
    return <span className="text-xs text-muted-foreground">Super Admin</span>;
  }

  return (
    <Select value={user.role ? String(user.role.id) : "none"} onValueChange={changer} disabled={pending}>
      <SelectTrigger className="h-8 w-44 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Aucun (usager)</SelectItem>
        {roles.map((r) => (
          <SelectItem key={r.id} value={String(r.id)}>
            {r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function UserActiveToggle({ user, onUpdated }: { user: UserAdmin; onUpdated: () => void }) {
  const [pending, setPending] = useState(false);

  async function toggler() {
    setPending(true);
    try {
      await apiFetch(`/users/${user.id}/toggle-active`, { method: "POST" });
      toast.success(user.isActive ? "Compte désactivé." : "Compte activé.");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggler}
      disabled={pending}
      className="disabled:opacity-50"
    >
      {user.isActive ? (
        <Puce label="Actif" tone="success" />
      ) : (
        <Puce label="Désactivé" tone="warning" />
      )}
    </button>
  );
}

function RolesAdmin() {
  const { data: roles, loading, error, refetch } = useApiOne<RoleAdmin[]>("/roles");
  const { data: permissions } = useApiOne<PermissionOption[]>("/permissions");
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function togglePerm(id: number) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function creer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (nom.trim().length < 2) {
      setFormError("Le nom du rôle doit contenir au moins 2 caractères.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/roles", {
        method: "POST",
        body: JSON.stringify({ name: nom, permissionIds: Array.from(selectedPerms) }),
      });
      toast.success("Rôle créé.");
      setShowForm(false);
      setNom("");
      setSelectedPerms(new Set());
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  async function supprimer(id: number) {
    if (!window.confirm("Supprimer ce rôle ? Les utilisateurs qui l'ont perdront leurs permissions.")) return;
    try {
      await apiFetch(`/roles/${id}`, { method: "DELETE" });
      toast.success("Rôle supprimé.");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  if (loading) return <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-6 text-sm text-destructive">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold">Rôles & permissions</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Annuler" : "+ Nouveau rôle"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={creer} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5">
          <div className="grid gap-2 max-w-sm">
            <Label htmlFor="role-name">Nom du rôle *</Label>
            <Input id="role-name" value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
              {(permissions ?? []).map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedPerms.has(p.id)}
                    onChange={() => togglePerm(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
          <Button type="submit" disabled={submitting} className="justify-self-start">
            {submitting ? "Enregistrement…" : "Créer le rôle"}
          </Button>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(roles ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{r.name}</h3>
              <button onClick={() => supprimer(r.id)} className="text-xs text-destructive hover:underline">
                Supprimer
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.permissions.length} permission(s)</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.permissions.slice(0, 4).map((p) => (
                <span key={p.id} className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">
                  {p.action}
                </span>
              ))}
              {r.permissions.length > 4 && (
                <span className="text-[11px] text-muted-foreground">+{r.permissions.length - 4}</span>
              )}
            </div>
          </div>
        ))}
        {(roles ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun rôle pour l'instant.</p>
        )}
      </div>
    </div>
  );
}

function UtilisateursAdmin() {
  const { data: users, loading, error, refetch } = useApiList<UserAdmin>("/users?pageSize=100");
  const { data: roles } = useApiOne<RoleOption[]>("/roles");

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Chargement…</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8 grid gap-10">
      <div>
        <h2 className="font-heading text-lg font-semibold">Utilisateurs</h2>
        <TableauAdmin
          codeColumn={false}
          colonnes={["Utilisateur", "Rôle", "Inscrit le", "État"]}
          lignes={users.map((u) => [
            `${u.fullname} (${u.email})`,
            <UserRoleSelect key={u.id} user={u} roles={roles ?? []} onUpdated={refetch} />,
            formaterDate(u.dateJoined),
            <UserActiveToggle key={u.id} user={u} onUpdated={refetch} />,
          ])}
        />
      </div>
      <RolesAdmin />
    </div>
  );
}

function AdminLogin() {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      await login(String(data.get("email")), String(data.get("password")), "admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid h-full place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h1 className="text-xl font-bold">Administration ARPT</h1>
        <p className="mt-2 text-sm text-muted-foreground">Réservé au personnel de l'Autorité.</p>
        <div className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="admin-email">Adresse e-mail</Label>
            <Input id="admin-email" name="email" type="email" required placeholder="vous@arpt.gov.gn" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-password">Mot de passe</Label>
            <Input id="admin-password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-1">
            {submitting ? "Connexion…" : "Se connecter"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Puce({ label, tone }: { label: string; tone: "success" | "warning" | "info" }) {
  const styles = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    info: "bg-accent text-accent-foreground",
  };

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", styles[tone])}>{label}</span>;
}