"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Archive,
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
  Download,
  Eye,
  LogOut,
  MessageSquare,
  Mail,
  MailOpen,
  Paperclip,
  ChevronLeft,
  Pencil,
  Radio,
  Reply,
  Search,
  Send,
  Trash2,
  UserRound,
  ScrollText,
  Settings,
  Smartphone,
  TowerControl,
  TrendingUp,
  Users,
  Vote,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import { apiFetch, type PaginatedResult } from "@/lib/api";
import { formaterDate } from "@/data/mock";
import { ApplicationsAdmin } from "@/components/admin/ApplicationsAdmin";
import { Sidebar } from "@/components/sidebar";
import { useDocumentPreview } from "@/components/site/DocumentPreview";
import { exporterTableau, type ExportFormat } from "@/lib/export-table";

interface MenuItem {
  id: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "reclamationsOuvertes" | "messagesNonLus";
}

// titreKey/id résolus via t(`nav.groups.${titreKey}`) / t(`nav.${id}`)
// (namespace "admin", voir messages/*.json) plutôt que du texte en dur —
// menuGroups vit hors composant donc ne peut pas appeler useTranslations().
const menuGroups: { titreKey: string; items: MenuItem[] }[] = [
  {
    titreKey: "overview",
    items: [{ id: "tableau", icon: LayoutDashboard }],
  },
  {
    titreKey: "users",
    items: [
      { id: "reclamations", icon: MessageSquareWarning, badgeKey: "reclamationsOuvertes" },
      { id: "candidatures", icon: Briefcase },
      { id: "messages", icon: Inbox, badgeKey: "messagesNonLus" },
    ],
  },
  {
    titreKey: "siteContent",
    items: [
      { id: "pages", icon: LayoutTemplate },
      { id: "services", icon: Layers },
      { id: "equipements", icon: Radio },
      { id: "marches", icon: Gavel },
      { id: "carrieres", icon: Briefcase },
      { id: "actualites", icon: Newspaper },
      { id: "communiques", icon: FileCheck2 },
      { id: "reglementation", icon: ScrollText },
      { id: "consultations", icon: Vote },
    ],
  },
  {
    titreKey: "analysis",
    items: [
      { id: "statistiques", icon: BarChart3 },
      { id: "audit", icon: History },
    ],
  },
  {
    titreKey: "administration",
    items: [
      { id: "utilisateurs", icon: Users },
      { id: "config", icon: Settings },
    ],
  },
];

const menus = menuGroups.flatMap((g) => g.items).map((m) => ({ ...m, href: `/admin?section=${m.id}` }));


const kpiIcons = [MessageSquareWarning, Users, Inbox];

/**
 * Remplace window.confirm() pour toutes les suppressions du panneau admin —
 * un dialogue navigateur natif (bloquant, non stylé, incohérent d'un
 * navigateur à l'autre) n'a pas sa place dans une UI applicative. Un seul
 * <dialog> partagé (monté une fois par ConfirmProvider) plutôt qu'une
 * instance par module : chaque appelant obtient juste confirm(message),
 * une Promise<boolean> résolue par le clic Annuler/Supprimer ou Échap.
 */
const ConfirmContext = createContext<((message: string) => Promise<boolean>) | null>(null);

function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm doit être utilisé sous ConfirmProvider.");
  return confirm;
}

function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((msg: string) => {
    setMessage(msg);
    dialogRef.current?.showModal();
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function repondre(value: boolean) {
    dialogRef.current?.close();
    resolveRef.current?.(value);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        onCancel={() => repondre(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) repondre(false);
        }}
        className="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-soft backdrop:bg-black/40"
      >
        <p className="text-sm">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => repondre(false)}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => repondre(true)}>
            Supprimer
          </Button>
        </div>
      </dialog>
    </ConfirmContext.Provider>
  );
}

interface AdminOverview {
  reclamations: { total: number; ouvertes: number } | null;
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
  // Chaque champ est optionnel côté admin (voir PointStatistiqueForm) — un
  // point statistique n'a pas forcément toutes ses valeurs renseignées, et
  // kpis lui-même est absent si l'année n'a aucun point mensuel (voir
  // StatisticsService.getOverview côté backend).
  kpis: {
    subscribersMillion: number | null;
    penetrationRate: number | null;
    activeOperators: number | null;
    active4GSites: number | null;
  } | null;
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

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Fait le lien entre le type d'événement (voir NotificationsService côté backend) et l'onglet du dashboard où le traiter. */
const NOTIFICATION_SECTION_BY_TYPE: Record<string, string> = {
  "submission.created": "candidatures",
  "submission.status_changed": "candidatures",
  "user.registered": "utilisateurs",
  "user.enterprise_registered": "utilisateurs",
  "user.enterprise_status_changed": "utilisateurs",
  "candidature.created": "candidatures",
  "candidature.status_changed": "candidatures",
  "contact_message.created": "messages",
  "claim.created": "reclamations",
  "claim.status_changed": "reclamations",
};

const NOTIFICATIONS_POLL_MS = 30_000;

function NotificationsBell({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let annule = false;
    async function charger() {
      try {
        const res = await apiFetch<{ count: number }>("/notifications/unread-count");
        if (!annule) setUnread(res.count);
      } catch {
        // silencieux — le compteur réessaiera au prochain cycle de polling.
      }
    }
    charger();
    const interval = setInterval(charger, NOTIFICATIONS_POLL_MS);
    return () => {
      annule = true;
      clearInterval(interval);
    };
  }, []);

  async function ouvrir() {
    const prochainEtat = !open;
    setOpen(prochainEtat);
    if (!prochainEtat) return;
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedResult<NotificationItem>>("/notifications?pageSize=15");
      setItems(res.results);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function cliquerNotification(n: NotificationItem) {
    if (!n.isRead) {
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it)));
      setUnread((c) => Math.max(0, c - 1));
      apiFetch(`/notifications/${n.id}/read`, { method: "POST" }).catch(() => { });
    }
    setOpen(false);
    const section = NOTIFICATION_SECTION_BY_TYPE[n.type];
    if (section) onNavigate(section);
  }

  async function toutMarquerLu() {
    setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
    setUnread(0);
    try {
      await apiFetch("/notifications/read-all", { method: "POST" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur, réessayez.");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={ouvrir}
        title="Notifications"
        className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
      >
        <Bell className="size-[18px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-full right-0 z-20 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={toutMarquerLu} className="text-xs font-medium text-primary hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && <p className="p-4 text-center text-xs text-muted-foreground">Chargement…</p>}
            {!loading && items.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground">Aucune notification.</p>
            )}
            {!loading &&
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => cliquerNotification(n)}
                  className={cn(
                    "block w-full border-b border-border px-4 py-3 text-left text-xs transition-colors last:border-0 hover:bg-muted/60",
                    !n.isRead && "bg-accent/40",
                  )}
                >
                  <p className="font-medium text-foreground">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">{formaterDate(n.createdAt)}</p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const t = useTranslations("admin");
  const [section, setSection] = useState<string>("tableau");
  const courant = menus.find((m) => m.id === section) ?? menus[0];
  const { user, loading: authLoading, logout, hasPermission } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const staff = Boolean(user?.isStaff || user?.isSuperuser || user?.role);
  const { data: overview } = useApiOne<AdminOverview>(staff ? "/dashboard/admin-overview" : null);
  const { data: overviewStats } = useApiOne<SectorOverview>(staff ? "/statistics/overview?lang=fr" : null);
  const { data: reclamationsRecentes } = useApiList<ClaimAdmin>(staff ? "/claims?lang=fr&pageSize=3" : null);
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
      { libelle: t("dashboard.kpi.openClaims"), valeur: overview.reclamations?.ouvertes ?? "—" },
      { libelle: t("dashboard.kpi.candidatures"), valeur: overview.candidatures?.total ?? "—" },
      { libelle: t("dashboard.kpi.unreadMessages"), valeur: overview.messagesContact?.nonLus ?? "—" },
    ]
    : [];

  const caReel = (overviewStats?.quarterlySeries ?? []).map((q) => ({
    trimestre: `T${q.quarter} ${q.year}`,
    ca: q.revenueBillionGNF,
  }));

  // Chaque champ de kpis est optionnel côté admin (voir PointStatistiqueForm)
  // — un point statistique n'a pas forcément activeOperators/active4GSites
  // renseignés, donc jamais d'accès direct à .toLocaleString() sans garde
  // nullité (a fait planter ce tableau de bord en prod : Cannot read
  // properties of null).
  const indicateursSectoriels = overviewStats?.kpis
    ? [
      { libelle: t("dashboard.sectorKpi.mobileSubscribers"), valeur: overviewStats.kpis.subscribersMillion != null ? `${overviewStats.kpis.subscribersMillion.toLocaleString("fr-FR")} M` : "—", icon: Smartphone },
      { libelle: t("dashboard.sectorKpi.penetrationRate"), valeur: overviewStats.kpis.penetrationRate != null ? `${overviewStats.kpis.penetrationRate} %` : "—", icon: TrendingUp },
      { libelle: t("dashboard.sectorKpi.activeOperators"), valeur: overviewStats.kpis.activeOperators != null ? `${overviewStats.kpis.activeOperators}` : "—", icon: Users },
      { libelle: t("dashboard.sectorKpi.active4GSites"), valeur: overviewStats.kpis.active4GSites != null ? overviewStats.kpis.active4GSites.toLocaleString("fr-FR") : "—", icon: TowerControl },
    ]
    : [];

  const variationCA =
    caReel.length >= 2
      ? ((caReel[caReel.length - 1].ca - caReel[caReel.length - 2].ca) / caReel[caReel.length - 2].ca) * 100
      : null;

  const actionsReelles = overview
    ? [
      {
        label: t("dashboard.todo.qualifyClaims"),
        detail: t("dashboard.todo.qualifyClaimsDetail", { count: overview.reclamations?.ouvertes ?? 0 }),
        icon: AlertCircle,
        tone: "text-warning",
      },
      {
        label: t("dashboard.todo.unreadContactMessages"),
        detail: t("dashboard.todo.unreadContactMessagesDetail", { count: overview.messagesContact?.nonLus ?? 0 }),
        icon: Newspaper,
        tone: "text-chart-2",
      },
    ]
    : [];

  if (authLoading) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">{t("common.loading")}</div>;
  }

  // Doit rester cohérent avec la définition d'un "compte admin" côté backend
  // (AuthService.login: isAdminAccount = isSuperuser || roleId !== null) —
  // isStaff seul (jamais renseigné par UsersService.createByAdmin, le flux
  // d'invitation admin) laissait un compte avec un rôle assigné coincé sur
  // cet écran de connexion après une authentification pourtant réussie.
  if (!user?.isStaff && !user?.isSuperuser && !user?.role) {
    return <AdminLogin />;
  }

  return (
    <ConfirmProvider>
      <Group orientation="horizontal" className="h-full min-h-0 w-full">
        <Sidebar menuGroups={menuGroups} section={section} overview={overview} onSectionChange={setSection} />
        <Separator className="group relative w-2 shrink-0 bg-border/70 transition-colors hover:bg-primary/40 focus-visible:bg-primary/60" aria-label={t("sidebar.resizeSidebar")}>
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
        </Separator>
        <Panel id="content" defaultSize="100" minSize="80" className="h-full min-w-0 overflow-y-auto">

          <div className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-6">
            {/* 1. Controlled, compact search bar */}
            <div className="flex w-full max-w-xs items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="text"
                placeholder={t("header.searchPlaceholder")}
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Right Actions & Profile */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSection("audit")}
                title={t("header.auditLog")}
                className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <History className="size-[18px]" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setSection("messages")}
                title={t("header.messages")}
                className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <MessageSquare className="size-[18px]" aria-hidden />
                {!!overview?.messagesContact?.nonLus && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-card bg-gold" />
                )}
              </button>

              <NotificationsBell onNavigate={setSection} />

              {/* 2. Compacted Locale Switcher wrapper */}
              <div className="flex items-center px-1">
                <LocaleSwitcher className="h-9 px-2.5 rounded-md border border-border bg-transparent text-xs font-medium shadow-none hover:bg-surface" />
              </div>

              {/* Divider */}
              <div className="h-5 w-px bg-border mx-1" />

              {/* 3. User Profile Dropdown with secure text wrapping protection */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-md py-1.5 px-2 transition-colors hover:bg-surface"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-gold-foreground">
                    {user.fullname.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-left sm:block whitespace-nowrap">
                    <span className="block text-xs leading-tight font-semibold">{user.fullname}</span>
                    <span className="block text-[11px] leading-tight text-muted-foreground">
                      {user.isSuperuser ? t("header.superAdmin") : (user.role?.name ?? t("header.administrator"))}
                    </span>
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground shrink-0" aria-hidden />
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full right-0 z-20 mt-2 w-48 rounded-md border border-border bg-card p-1.5 shadow-lg">
                    <div className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground truncate">
                      <UserRound className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="size-4 shrink-0" aria-hidden /> {t("header.logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 bg-surface-fade p-6 lg:p-10">
            <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold">{t(`nav.${courant.id}`)}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
              </div>

            </header>

            {section === "tableau" && (
              <div className="mt-8 grid gap-6">
                <section className="relative overflow-hidden rounded-2xl bg-institution p-6 text-primary-foreground shadow-lifted lg:p-8">
                  <div className="relative z-1 max-w-2xl">
                    <p className="text-xs font-semibold tracking-[0.16em] text-primary-foreground/65 uppercase">
                      {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {t("dashboard.overviewSuffix")}
                    </p>
                    <h2 className="mt-3 font-heading text-2xl font-semibold lg:text-3xl">{t("dashboard.greeting", { name: user.fullname.split(" ")[0] })}</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">{t("dashboard.heroBody")}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button onClick={() => setSection("reclamations")} className="inline-flex items-center gap-2 rounded-md bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition-transform hover:-translate-y-0.5">{t("dashboard.handleClaims")} <ArrowUpRight className="size-4" aria-hidden /></button>
                      <button onClick={() => setSection("audit")} className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/25 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10">{t("dashboard.viewLog")} <ChevronRight className="size-4" aria-hidden /></button>
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
                      {t("dashboard.sectorObservatory", { year: overviewStats?.year ?? "" })}
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

                <div className="grid gap-6 grid-cols-2">
                  {/* <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">{t("dashboard.revenue.title")}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.revenue.subtitle")}</p>
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
                        <Bar dataKey="ca" name={t("dashboard.revenue.seriesName")} fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div> */}

                  <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="font-heading text-lg font-semibold">{t("dashboard.todo.title")}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.todo.subtitle")}</p>
                      </div>
                      <span className="grid size-8 place-items-center rounded-full bg-warning/15 text-sm font-bold text-warning-foreground">
                        {(overview?.reclamations?.ouvertes ?? 0) +
                          (overview?.messagesContact?.nonLus ?? 0)}
                      </span>
                    </div>
                    <ul className="mt-5 divide-y divide-border">
                      {actionsReelles.map((action) => <li key={action.label} className="flex gap-3 py-4 first:pt-0 last:pb-0"><action.icon className={cn("mt-0.5 size-4 shrink-0", action.tone)} aria-hidden /><div className="min-w-0"><p className="text-sm font-medium">{action.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{action.detail}</p></div></li>)}
                    </ul>
                  </div>

                  <div className="min-w-0 rounded-xl border border-border bg-card shadow-soft">
                    <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 lg:px-6"><div><h2 className="font-heading text-lg font-semibold">{t("dashboard.recentClaims.title")}</h2><p className="mt-1 text-xs text-muted-foreground">{t("dashboard.recentClaims.subtitle")}</p></div><button onClick={() => setSection("reclamations")} className="text-xs font-semibold text-primary hover:underline">{t("dashboard.recentClaims.viewAll")}</button></div>
                    <TableauAdmin
                      compact
                      colonnes={t.raw("dashboard.recentClaims.columns") as string[]}
                      lignes={reclamationsRecentes.map((r) => [
                        `REC-${r.id}`,
                        r.claimType,
                        r.concernedOperator,
                        <StatutBadge key={r.id} statut={r.status} />,
                      ])}
                    />
                    {reclamationsRecentes.length === 0 && (
                      <p className="px-5 py-6 text-center text-xs text-muted-foreground">{t("dashboard.recentClaims.empty")}</p>
                    )}
                  </div>

                </div>
              </div>
            )}

            {section === "pages" && <PagesPubliquesAdmin />}
            {section === "reclamations" && <ReclamationsAdmin />}
            {section === "candidatures" && (hasPermission("view_candidatures") || hasPermission("view_submissions")) && <ApplicationsAdmin canViewCareers={hasPermission("view_candidatures")} canViewTenders={hasPermission("view_submissions")} canManageCareers={hasPermission("manage_carrieres")} canManageTenders={hasPermission("manage_appels_offres")} />}
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
    </ConfirmProvider>
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
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
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

const EQUIPMENT_STATUTS: EquipementAdmin["status"][] = ["HOMOLOGUE", "EN_COURS", "INTERDIT"];

function EquipementsAdmin() {
  const t = useTranslations("admin.equipements");
  const tCommon = useTranslations("admin.common");
  const confirm = useConfirm();
  const { data: equipements, loading, error, refetch } = useApiList<EquipementAdmin>("/equipment?lang=fr&pageSize=100");
  const { data: categories } = useApiOne<EquipmentCategoryOption[]>("/equipment-categories?lang=fr");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EquipementAdmin | null>(null);
  const [status, setStatus] = useState<EquipementAdmin["status"] | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"all" | EquipementAdmin["status"]>("all");
  const [filtreCategorie, setFiltreCategorie] = useState("all");
  const [page, setPage] = useState(1);

  function reinitialiser() {
    setRecherche("");
    setFiltreStatut("all");
    setFiltreCategorie("all");
    setPage(1);
  }

  const resultat = equipements.filter((e) => {
    const correspondRecherche = `${e.code} ${e.name} ${e.brand} ${e.model}`.toLocaleLowerCase("fr").includes(recherche.trim().toLocaleLowerCase("fr"));
    const correspondStatut = filtreStatut === "all" || e.status === filtreStatut;
    const correspondCategorie = filtreCategorie === "all" || e.category.slug === filtreCategorie;
    return correspondRecherche && correspondStatut && correspondCategorie;
  });
  const totalPages = Math.max(1, Math.ceil(resultat.length / PAGE_SIZE_ADMIN));
  const pageCourante = Math.min(page, totalPages);
  const resultatPage = resultat.slice((pageCourante - 1) * PAGE_SIZE_ADMIN, pageCourante * PAGE_SIZE_ADMIN);
  const homologues = equipements.filter((e) => e.status === "HOMOLOGUE").length;
  const enCoursCount = equipements.filter((e) => e.status === "EN_COURS").length;
  const interdits = equipements.filter((e) => e.status === "INTERDIT").length;

  function changerPage(p: number) {
    setPage(Math.min(Math.max(p, 1), totalPages));
  }

  function exporter(format: ExportFormat = "csv") {
    exporterTableau(format,
      `${t("csv.filenamePrefix")}-${new Date().toISOString().slice(0, 10)}.csv`,
      t.raw("csv.headers") as string[],
      resultat.map((e) => [e.code, e.name, e.brand, e.model, e.category.name, t(`statutOptions.${e.status}`)]),
    );
  }

  function ouvrirCreation() {
    setEditing(null);
    setStatus("");
    setCategoryId("");
    setShowForm((v) => !v);
  }

  function ouvrirEdition(equipement: EquipementAdmin) {
    setEditing(equipement);
    setStatus(equipement.status);
    setCategoryId(String(equipement.category.id));
    setShowForm(true);
  }

  async function supprimer(equipement: EquipementAdmin) {
    if (!(await confirm(t("confirmDelete", { name: equipement.name })))) return;
    try {
      await apiFetch(`/equipment/${equipement.id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!status || !categoryId) {
      setFormError(t("requiredFields"));
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
        toast.success(t("updated"));
      } else {
        await apiFetch("/equipment", { method: "POST", body });
        toast.success(t("created"));
      }
      setShowForm(false);
      setEditing(null);
      setStatus("");
      setCategoryId("");
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
            <Radio className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => exporter("csv")} className="gap-1.5"><Download className="size-4" aria-hidden /> CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => exporter("pdf")} className="gap-1.5"><FileText className="size-4" aria-hidden /> PDF</Button>
          <Button size="sm" onClick={ouvrirCreation}>
            {showForm && !editing ? tCommon("cancel") : t("newEquipment")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTrendCard icon={Radio} tone="primary" value={equipements.length} label={t("stats.total")} />
        <StatTrendCard icon={CheckCircle2} tone="success" value={homologues} label={t("stats.approved")} />
        <StatTrendCard icon={Clock3} tone="warning" value={enCoursCount} label={t("stats.inProgress")} />
        <StatTrendCard icon={X} tone="destructive" value={interdits} label={t("stats.forbidden")} />
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? t("editingTitle", { name: editing.name }) : t("newEquipmentTitle")}</p>
          <div className="grid gap-2">
            <Label htmlFor="eq-code">{t("fields.code")}</Label>
            <Input id="eq-code" name="code" required placeholder={t("fields.codePlaceholder")} defaultValue={editing?.code} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-name">{t("fields.name")}</Label>
            <Input id="eq-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-type">{t("fields.type")}</Label>
            <Input id="eq-type" name="typeFr" required placeholder={t("fields.typePlaceholder")} defaultValue={editing?.type} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-status">{t("fields.status")} <span aria-hidden="true" className="text-destructive">*</span></Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EquipementAdmin["status"])}>
              <SelectTrigger id="eq-status" aria-required="true">
                <SelectValue placeholder={tCommon("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`statutOptions.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-brand">{t("fields.brand")}</Label>
            <Input id="eq-brand" name="brand" required defaultValue={editing?.brand} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-model">{t("fields.model")}</Label>
            <Input id="eq-model" name="model" required defaultValue={editing?.model} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-manufacturer">{t("fields.manufacturer")}</Label>
            <Input id="eq-manufacturer" name="manufacturer" required defaultValue={editing?.manufacturer} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-category">{tCommon("category")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="eq-category" aria-required="true">
                <SelectValue placeholder={tCommon("selectPlaceholder")} />
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
            <Label htmlFor="eq-homolog">{t("fields.homologationNumber")}</Label>
            <Input id="eq-homolog" name="homologationNumber" placeholder={t("fields.homologationOptional")} defaultValue={editing?.homologationNumber ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eq-validite">{t("fields.validUntil")}</Label>
            <Input id="eq-validite" name="validUntil" type="date" defaultValue={editing?.validUntil?.slice(0, 10) ?? ""} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="eq-certificate">{t("fields.certificate", { hint: editing ? t("fields.fileHintKeep") : t("fields.fileHintOptional") })}</Label>
            <Input id="eq-certificate" name="certificate" type="file" accept=".pdf" />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? tCommon("saving") : editing ? tCommon("save") : t("newEquipmentTitle")}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                {tCommon("cancel")}
              </Button>
            )}
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>}
      {error && !loading && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="grid gap-3 border-b border-border bg-surface/55 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_10rem_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={recherche}
                onChange={(event) => { setRecherche(event.target.value); setPage(1); }}
                className="h-9 bg-card pl-9 text-xs"
                placeholder={t("searchPlaceholder")}
              />
            </div>
            <Select value={filtreStatut} onValueChange={(value) => { setFiltreStatut(value as typeof filtreStatut); setPage(1); }}>
              <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("allStatuses")}</SelectItem>
                {EQUIPMENT_STATUTS.map((s) => <SelectItem key={s} value={s}>{t(`statutOptions.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtreCategorie} onValueChange={(value) => { setFiltreCategorie(value); setPage(1); }}>
              <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("allCategories")}</SelectItem>
                {(categories ?? []).map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" variant="ghost" onClick={reinitialiser} className="justify-self-start text-xs lg:justify-self-end">
              {tCommon("reset")}
            </Button>
          </div>

          <TableauAdmin
            compact
            colonnes={[t("columns.reference"), t("columns.equipment"), t("columns.brandModel"), t("columns.category"), t("columns.validity"), tCommon("status"), tCommon("actions")]}
            lignes={resultatPage.map((e) => [
              e.code,
              e.name,
              `${e.brand} · ${e.model}`,
              e.category.name,
              e.validUntil ? formaterDate(e.validUntil) : "—",
              <StatutBadge key={e.id} statut={e.status} />,
              <RowActions key={e.id} onEdit={() => ouvrirEdition(e)} onDelete={() => supprimer(e)} />,
            ])}
          />
          {resultatPage.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted-foreground">{t("noResults")}</p>}

          <PaginationAdmin page={pageCourante} totalItems={resultat.length} pageSize={PAGE_SIZE_ADMIN} onPageChange={changerPage} />
        </div>
      )}
    </section>
  );
}

const PAGE_SIZE_ADMIN = 6;
const SEMAINE_MS = 7 * 24 * 60 * 60 * 1000;

function depuisMoinsDuneSemaine(iso: string) {
  return Date.now() - new Date(iso).getTime() <= SEMAINE_MS;
}

function formaterHeure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function StatTrendCard({
  icon: Icon,
  tone,
  value,
  label,
  delta,
}: {
  icon: typeof FileText;
  tone: "primary" | "warning" | "success" | "destructive";
  value: number;
  label: string;
  delta?: number;
}) {
  const tCommon = useTranslations("admin.common");
  const toneStyles: Record<typeof tone, string> = {
    primary: "bg-teal-600 text-white shadow transition-colors hover:bg-teal-700",
    warning: "bg-teal-600 text-white shadow transition-colors hover:bg-teal-700",
    success: "bg-teal-600 text-white shadow transition-colors hover:bg-teal-700",
    destructive: "bg-teal-600 text-white shadow transition-colors hover:bg-teal-700",
  };
  const deltaStyle = !delta ? "text-muted-foreground" : delta > 0 ? "text-success" : "text-destructive";
  const deltaTexte = !delta ? "0" : delta > 0 ? `↑ ${delta}` : `↓ ${Math.abs(delta)}`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneStyles[tone])}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {delta !== undefined && (
          <p className={cn("mt-0.5 text-[11px] font-semibold", deltaStyle)}>{deltaTexte} {tCommon("thisWeek")}</p>
        )}
      </div>
    </div>
  );
}

function PaginationAdmin({
  page,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const tCommon = useTranslations("admin.common");
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;
  const debut = (page - 1) * pageSize + 1;
  const fin = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {tCommon("showingResults", { start: debut, end: fin, total: totalItems })}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              "grid size-7 place-items-center rounded-md text-xs font-semibold transition-colors",
              p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-primary",
            )}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

interface ClaimAttachment {
  id: number;
  filename: string;
  url: string;
}

interface ClaimAdminFull {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string | null;
  concernedOperator: string;
  claimType: string;
  claimDescription: string;
  rejectionReason: string | null;
  status: "NOUVEAU" | "EN_COURS" | "RESOLU" | "REJETE";
  createdAt: string;
  updatedAt: string;
  attachments: ClaimAttachment[];
}

const CLAIM_STATUTS: ClaimAdminFull["status"][] = ["NOUVEAU", "EN_COURS", "RESOLU", "REJETE"];

function ClaimStatusSelect({ claim, onUpdated }: { claim: ClaimAdminFull; onUpdated: () => void }) {
  const t = useTranslations("admin.reclamations");
  const tCommon = useTranslations("admin.common");
  const tStatus = useTranslations("status");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  async function updateStatus(status: ClaimAdminFull["status"], rejectionReason?: string) {
    if (status === "REJETE" && (!rejectionReason || rejectionReason.trim().length < 10)) {
      setReasonError(t("rejectReasonRequired"));
      return;
    }
    setPending(true);
    try {
      const result = await apiFetch<{ emailSent?: boolean | null }>(`/claims/${claim.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          ...(rejectionReason ? { reason: rejectionReason.trim() } : {}),
        }),
      });
      dialogRef.current?.close();
      toast.success(t("statusUpdated"));
      if (result.emailSent === false) toast.warning(t("emailNotSent"));
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setPending(false);
    }
  }

  function changer(status: string) {
    if (status === claim.status) return;
    if (status === "REJETE") {
      setReason("");
      setReasonError("");
      dialogRef.current?.showModal();
      return;
    }
    void updateStatus(status as ClaimAdminFull["status"]);
  }

  return (
    <>
      <Select value={claim.status} onValueChange={changer} disabled={pending}>
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CLAIM_STATUTS.map((status) => (
            <SelectItem key={status} value={status}>
              {tStatus(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        onClick={(event) => {
          if (!pending && event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-card p-6 text-card-foreground shadow-soft backdrop:bg-black/40"
      >
        <form onSubmit={(event) => { event.preventDefault(); void updateStatus("REJETE", reason); }}>
          <h3 className="font-heading text-lg font-semibold">{t("confirmRejection")}</h3>
          <label htmlFor={`claim-rejection-reason-${claim.id}`} className="mt-4 block text-sm font-medium">
            {t("rejectReasonPrompt")}
          </label>
          <Textarea
            id={`claim-rejection-reason-${claim.id}`}
            value={reason}
            onChange={(event) => { setReason(event.target.value); setReasonError(""); }}
            minLength={10}
            rows={4}
            required
            className="mt-2"
            aria-invalid={Boolean(reasonError)}
            aria-describedby={reasonError ? `claim-rejection-error-${claim.id}` : undefined}
          />
          {reasonError && <p id={`claim-rejection-error-${claim.id}`} className="mt-2 text-sm text-destructive" role="alert">{reasonError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={pending} onClick={() => dialogRef.current?.close()}>{tCommon("cancel")}</Button>
            <Button type="submit" disabled={pending || reason.trim().length < 10}>{t("confirmRejection")}</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
function ReclamationsAdmin() {
  const t = useTranslations("admin.reclamations");
  const tCommon = useTranslations("admin.common");
  const tStatus = useTranslations("status");
  const confirm = useConfirm();
  const { data: claims, loading, error, refetch } = useApiList<ClaimAdminFull>("/claims?lang=fr&pageSize=100");
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"all" | ClaimAdminFull["status"]>("all");
  const [filtreCategorie, setFiltreCategorie] = useState("all");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const categories = Array.from(new Set(claims.map((claim) => claim.claimType))).filter(Boolean);

  function reinitialiser() {
    setRecherche("");
    setFiltreStatut("all");
    setFiltreCategorie("all");
    setDateDebut("");
    setDateFin("");
    setPage(1);
  }

  const resultat = claims.filter((claim) => {
    const termes = `${claim.firstname} ${claim.lastname} ${claim.concernedOperator} ${claim.email} ${claim.telephone ?? ""}`.toLocaleLowerCase("fr");
    const correspondRecherche = termes.includes(recherche.trim().toLocaleLowerCase("fr"));
    const correspondStatut = filtreStatut === "all" || claim.status === filtreStatut;
    const correspondCategorie = filtreCategorie === "all" || claim.claimType === filtreCategorie;
    const date = claim.createdAt.slice(0, 10);
    const correspondDateDebut = !dateDebut || date >= dateDebut;
    const correspondDateFin = !dateFin || date <= dateFin;
    return correspondRecherche && correspondStatut && correspondCategorie && correspondDateDebut && correspondDateFin;
  });

  const totalPages = Math.max(1, Math.ceil(resultat.length / PAGE_SIZE_ADMIN));
  const pageCourante = Math.min(page, totalPages);
  const resultatPage = resultat.slice((pageCourante - 1) * PAGE_SIZE_ADMIN, pageCourante * PAGE_SIZE_ADMIN);

  const enCours = claims.filter((claim) => claim.status === "EN_COURS");
  const resolues = claims.filter((claim) => claim.status === "RESOLU");
  const rejetees = claims.filter((claim) => claim.status === "REJETE");
  const nouvellesCetteSemaine = claims.filter((claim) => depuisMoinsDuneSemaine(claim.createdAt)).length;

  function changerPage(p: number) {
    setPage(Math.min(Math.max(p, 1), totalPages));
  }

  function basculerSelection(id: number) {
    setSelection((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  }

  function basculerSelectionPage() {
    const idsPage = resultatPage.map((c) => c.id);
    const tousSelectionnes = idsPage.every((id) => selection.has(id));
    setSelection((prev) => {
      const suivant = new Set(prev);
      idsPage.forEach((id) => (tousSelectionnes ? suivant.delete(id) : suivant.add(id)));
      return suivant;
    });
  }

  async function supprimerSelection() {
    if (selection.size === 0) return;
    if (!(await confirm(t("confirmDeleteSelection", { count: selection.size })))) return;
    setSuppressionEnCours(true);
    try {
      await Promise.all(Array.from(selection).map((id) => apiFetch(`/claims/${id}`, { method: "DELETE" })));
      toast.success(t("deletedSelection"));
      setSelection(new Set());
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSuppressionEnCours(false);
    }
  }

  async function supprimerUne(claim: ClaimAdminFull) {
    if (!(await confirm(t("confirmDeleteOne", { name: `${claim.firstname} ${claim.lastname}` })))) return;
    try {
      await apiFetch(`/claims/${claim.id}`, { method: "DELETE" });
      toast.success(t("deletedOne"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  }

  function exporter(format: ExportFormat = "csv") {
    exporterTableau(format,
      `${t("csv.filenamePrefix")}-${new Date().toISOString().slice(0, 10)}.csv`,
      t.raw("csv.headers") as string[],
      resultat.map((c) => [c.firstname, c.lastname, c.email, c.telephone ?? "", c.concernedOperator, c.claimType, tStatus(c.status), formaterDate(c.createdAt)]),
    );
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
            <MessageSquareWarning className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => exporter("csv")} className="gap-1.5"><Download className="size-4" aria-hidden /> CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => exporter("pdf")} className="gap-1.5"><FileText className="size-4" aria-hidden /> PDF</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTrendCard icon={FileText} tone="primary" value={claims.length} label={t("stats.total")} delta={nouvellesCetteSemaine} />
        <StatTrendCard icon={Clock3} tone="warning" value={enCours.length} label={t("stats.inProgress")} delta={enCours.filter((c) => depuisMoinsDuneSemaine(c.updatedAt)).length} />
        <StatTrendCard icon={CheckCircle2} tone="success" value={resolues.length} label={t("stats.resolved")} delta={resolues.filter((c) => depuisMoinsDuneSemaine(c.updatedAt)).length} />
        <StatTrendCard icon={X} tone="destructive" value={rejetees.length} label={t("stats.rejected")} delta={rejetees.filter((c) => depuisMoinsDuneSemaine(c.updatedAt)).length} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid gap-3 border-b border-border bg-surface/55 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_10rem_9rem_9rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={recherche}
              onChange={(event) => { setRecherche(event.target.value); setPage(1); }}
              className="h-9 bg-card pl-9 text-xs"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Select value={filtreStatut} onValueChange={(value) => { setFiltreStatut(value as typeof filtreStatut); setPage(1); }}>
            <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {CLAIM_STATUTS.map((item) => <SelectItem key={item} value={item}>{tStatus(item)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtreCategorie} onValueChange={(value) => { setFiltreCategorie(value); setPage(1); }}>
            <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateDebut} onChange={(event) => { setDateDebut(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={t("startDate")} />
          <Input type="date" value={dateFin} onChange={(event) => { setDateFin(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={t("endDate")} />
          <Button type="button" size="sm" variant="ghost" onClick={reinitialiser} className="justify-self-start text-xs lg:justify-self-end">
            {t("reset")}
          </Button>
        </div>

        {selection.size > 0 && (
          <div className="flex items-center justify-between gap-3 border-b border-border bg-destructive/5 px-5 py-2.5">
            <p className="text-xs font-medium text-destructive">{t("selectedCount", { count: selection.size })}</p>
            <Button type="button" size="sm" variant="outline" onClick={supprimerSelection} disabled={suppressionEnCours} className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" aria-hidden /> {t("deleteSelection")}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[54rem] text-left text-sm">
            <thead className="border-b border-border text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={resultatPage.length > 0 && resultatPage.every((c) => selection.has(c.id))}
                    onChange={basculerSelectionPage}
                    aria-label={t("selectPage")}
                  />
                </th>
                <th className="px-4 py-3">{t("columns.user")}</th>
                <th className="px-4 py-3">{t("columns.nature")}</th>
                <th className="px-4 py-3">{t("columns.category")}</th>
                <th className="px-4 py-3">{t("columns.date")}</th>
                <th className="px-4 py-3">{t("columns.status")}</th>
                <th className="px-5 py-3 text-right">{tCommon("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resultatPage.flatMap((claim) => {
                const ligne = (
                  <tr key={claim.id} className="transition-colors hover:bg-accent/25">
                    <td className="px-5 py-3.5">
                      <input type="checkbox" checked={selection.has(claim.id)} onChange={() => basculerSelection(claim.id)} aria-label={t("selectRow", { name: `${claim.firstname} ${claim.lastname}` })} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">
                          {initiales(`${claim.firstname} ${claim.lastname}`)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{claim.firstname} {claim.lastname}</p>
                          {claim.telephone && <p className="truncate text-xs text-muted-foreground">{claim.telephone}</p>}
                          <p className="truncate text-xs text-muted-foreground">{claim.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{t("natureValue")}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground">{claim.claimType}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <p>{formaterDate(claim.createdAt)}</p>
                      <p>{formaterHeure(claim.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3.5"><StatutBadge statut={claim.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setOuvert((v) => (v === claim.id ? null : claim.id))} aria-label={t("viewDetails")} title={t("viewDetails")} className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary">
                          <Eye className="size-4" aria-hidden />
                        </button>
                        <button type="button" onClick={() => supprimerUne(claim)} aria-label={tCommon("delete")} title={tCommon("delete")} className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                if (ouvert !== claim.id) return [ligne];
                return [
                  ligne,
                  <tr key={`${claim.id}-detail`}>
                    <td colSpan={7} className="bg-surface/60 px-5 py-5 sm:px-8">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("detail.operator")}</p>
                          <p className="mt-1 text-sm">{claim.concernedOperator}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("detail.fileStatus")}</p>
                          <div className="mt-1"><ClaimStatusSelect claim={claim} onUpdated={refetch} /></div>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("detail.description")}</p>
                          <p className="mt-1 text-sm leading-6 whitespace-pre-line text-muted-foreground">{claim.claimDescription}</p>
                        </div>
                        {claim.status === "REJETE" && claim.rejectionReason && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-semibold tracking-wide text-destructive uppercase">{t("detail.rejectionReason")}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{claim.rejectionReason}</p>
                          </div>
                        )}
                        {claim.attachments.length > 0 && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("detail.attachments")}</p>
                            <ul className="mt-1.5 flex flex-wrap gap-2">
                              {claim.attachments.map((piece) => (
                                <li key={piece.id}>
                                  <a href={piece.url} data-document-preview target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-primary hover:underline">
                                    <Paperclip className="size-3.5" aria-hidden /> {piece.filename}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>,
                ];
              })}
              {resultatPage.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">{t("noResults")}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationAdmin page={pageCourante} totalItems={resultat.length} pageSize={PAGE_SIZE_ADMIN} onPageChange={changerPage} />
      </div>
    </section>
  );
}

function AuditAdmin() {
  const t = useTranslations("admin.audit");
  const tCommon = useTranslations("admin.common");
  const { data: logs, loading, error } = useApiList<AuditLogEntry>("/audit-logs?pageSize=100");

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <TableauAdmin
      codeColumn={false}
      colonnes={t.raw("columns") as string[]}
      lignes={logs.map((j) => [j.actor?.email ?? t("system"), j.action, j.entity, formaterDate(j.createdAt)])}
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
  fileUrl: string | null;
  status: "OUVERT" | "CLOTURE" | "ANNULE";
}

const TENDER_STATUTS = ["OUVERT", "CLOTURE", "ANNULE"] as const;
const CONSULTATION_STATUTS = ["OUVERTE", "CLOTUREE"] as const;

function AppelsOffresAdmin() {
  const t = useTranslations("admin.tenders");
  const tCommon = useTranslations("admin.common");
  const tStatus = useTranslations("status");
  const confirm = useConfirm();
  const { data: tenders, loading, error, refetch } = useApiList<TendersCallAdmin>("/tenders?lang=fr&pageSize=100");
  const { data: categories } = useApiOne<{ id: number; name: string }[]>("/tender-categories?lang=fr");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TendersCallAdmin | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<string>("OUVERT");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"all" | (typeof TENDER_STATUTS)[number]>("all");
  const [filtreCategorie, setFiltreCategorie] = useState("all");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [page, setPage] = useState(1);

  const categoriesNoms = Array.from(new Set(tenders.map((tender) => tender.category.name)));

  function reinitialiser() {
    setRecherche("");
    setFiltreStatut("all");
    setFiltreCategorie("all");
    setDateDebut("");
    setDateFin("");
    setPage(1);
  }

  const resultat = tenders.filter((tender) => {
    const correspondRecherche = `${tender.name} ${tender.code}`.toLocaleLowerCase("fr").includes(recherche.trim().toLocaleLowerCase("fr"));
    const correspondStatut = filtreStatut === "all" || tender.status === filtreStatut;
    const correspondCategorie = filtreCategorie === "all" || tender.category.name === filtreCategorie;
    const date = tender.publicationDate.slice(0, 10);
    const correspondDateDebut = !dateDebut || date >= dateDebut;
    const correspondDateFin = !dateFin || date <= dateFin;
    return correspondRecherche && correspondStatut && correspondCategorie && correspondDateDebut && correspondDateFin;
  });
  const totalPages = Math.max(1, Math.ceil(resultat.length / PAGE_SIZE_ADMIN));
  const pageCourante = Math.min(page, totalPages);
  const resultatPage = resultat.slice((pageCourante - 1) * PAGE_SIZE_ADMIN, pageCourante * PAGE_SIZE_ADMIN);
  const ouverts = tenders.filter((tender) => tender.status === "OUVERT");
  const clotures = tenders.filter((tender) => tender.status === "CLOTURE");
  const annules = tenders.filter((tender) => tender.status === "ANNULE");
  const nouveauxCetteSemaine = tenders.filter((tender) => depuisMoinsDuneSemaine(tender.publicationDate)).length;

  function changerPage(p: number) {
    setPage(Math.min(Math.max(p, 1), totalPages));
  }

  function exporter(format: ExportFormat = "csv") {
    exporterTableau(format,
      `${t("csv.filenamePrefix")}-${new Date().toISOString().slice(0, 10)}.csv`,
      t.raw("csv.headers") as string[],
      resultat.map((tender) => [tender.code, tender.name, tender.category.name, tStatus(tender.status), formaterDate(tender.limitDate)]),
    );
  }

  function ouvrirCreation() {
    setEditing(null);
    setCategoryId("");
    setStatus("OUVERT");
    setShowForm((v) => !v);
  }

  function ouvrirEdition(tender: TendersCallAdmin) {
    setEditing(tender);
    setCategoryId(String(tender.category.id));
    setStatus(tender.status);
    setShowForm(true);
  }

  async function supprimer(tender: TendersCallAdmin) {
    if (!(await confirm(t("confirmDelete", { name: tender.name })))) return;
    try {
      await apiFetch(`/tenders/${tender.id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!categoryId) {
      setFormError(tCommon("requiredCategory"));
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
        toast.success(t("updated"));
      } else {
        await apiFetch("/tenders", { method: "POST", body });
        toast.success(t("created"));
      }
      setShowForm(false);
      setEditing(null);
      setCategoryId("");
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
            <Gavel className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => exporter("csv")} className="gap-1.5"><Download className="size-4" aria-hidden /> CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => exporter("pdf")} className="gap-1.5"><FileText className="size-4" aria-hidden /> PDF</Button>
          <Button size="sm" onClick={ouvrirCreation}>
            {showForm && !editing ? tCommon("cancel") : t("newTender")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTrendCard icon={Gavel} tone="primary" value={tenders.length} label={t("stats.total")} delta={nouveauxCetteSemaine} />
        <StatTrendCard icon={CheckCircle2} tone="success" value={ouverts.length} label={t("stats.open")} />
        <StatTrendCard icon={Clock3} tone="warning" value={clotures.length} label={t("stats.closed")} />
        <StatTrendCard icon={X} tone="destructive" value={annules.length} label={t("stats.cancelled")} />
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? t("editingTitle", { name: editing.name }) : t("newTenderTitle")}</p>
          <div className="grid gap-2">
            <Label htmlFor="ao-code">{t("fields.code")}</Label>
            <Input id="ao-code" name="code" required placeholder={t("fields.codePlaceholder")} defaultValue={editing?.code} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-name">{t("fields.title")}</Label>
            <Input id="ao-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="ao-description">{t("fields.description")}</Label>
            <Textarea id="ao-description" name="descriptionFr" required rows={3} defaultValue={editing?.description} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-category">{tCommon("category")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="ao-category" aria-required="true">
                <SelectValue placeholder={tCommon("selectPlaceholder")} />
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
            <Label htmlFor="ao-status">{tCommon("status")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="ao-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TENDER_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {tStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-pub">{t("fields.publicationDate")}</Label>
            <Input id="ao-pub" name="publicationDate" type="date" required defaultValue={editing?.publicationDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-limit">{t("fields.limitDate")}</Label>
            <Input id="ao-limit" name="limitDate" type="date" required defaultValue={editing?.limitDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-budget">{t("fields.budget")}</Label>
            <Input id="ao-budget" name="budget" type="number" placeholder={t("fields.budgetOptional")} defaultValue={editing?.budget ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-contact-name">{t("fields.contactName")}</Label>
            <Input id="ao-contact-name" name="contactName" required defaultValue={editing?.contactName} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ao-contact-email">{t("fields.contactEmail")}</Label>
            <Input id="ao-contact-email" name="contactEmail" type="email" required defaultValue={editing?.contactEmail} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="ao-dossier">{t("fields.file", { hint: editing ? t("fields.fileHintKeep") : t("fields.fileHintRequired") })}</Label>
            <Input id="ao-dossier" name="dossier" type="file" accept=".pdf" required={!editing || !editing.fileUrl} />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? tCommon("saving") : editing ? tCommon("save") : t("newTenderTitle")}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                {tCommon("cancel")}
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid gap-3 border-b border-border bg-surface/55 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_10rem_9rem_9rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={recherche}
              onChange={(event) => { setRecherche(event.target.value); setPage(1); }}
              className="h-9 bg-card pl-9 text-xs"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Select value={filtreStatut} onValueChange={(value) => { setFiltreStatut(value as typeof filtreStatut); setPage(1); }}>
            <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon("allStatuses")}</SelectItem>
              {TENDER_STATUTS.map((s) => <SelectItem key={s} value={s}>{tStatus(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtreCategorie} onValueChange={(value) => { setFiltreCategorie(value); setPage(1); }}>
            <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon("allCategories")}</SelectItem>
              {categoriesNoms.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateDebut} onChange={(event) => { setDateDebut(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("startDate")} />
          <Input type="date" value={dateFin} onChange={(event) => { setDateFin(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("endDate")} />
          <Button type="button" size="sm" variant="ghost" onClick={reinitialiser} className="justify-self-start text-xs lg:justify-self-end">
            {tCommon("reset")}
          </Button>
        </div>

        <TableauAdmin
          compact
          colonnes={[t("columns.reference"), t("columns.title"), t("columns.category"), t("columns.limitDate"), t("columns.submissions"), tCommon("status"), tCommon("actions")]}
          lignes={resultatPage.map((tender) => [
            tender.code,
            <div key={tender.id}><span>{tender.name}</span>{!tender.fileUrl && <span className="mt-1 block text-xs font-semibold text-destructive">{t("missingDocument")}</span>}</div>,
            tender.category.name,
            formaterDate(tender.limitDate),
            tender.submissionCount,
            <StatutBadge key={tender.id} statut={tender.status} />,
            <RowActions key={tender.id} onEdit={() => ouvrirEdition(tender)} onDelete={() => supprimer(tender)} />,
          ])}
        />
        {resultatPage.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted-foreground">{t("noResults")}</p>}

        <PaginationAdmin page={pageCourante} totalItems={resultat.length} pageSize={PAGE_SIZE_ADMIN} onPageChange={changerPage} />
      </div>
    </section>
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
  const t = useTranslations("admin.careers");
  const tCommon = useTranslations("admin.common");
  const confirm = useConfirm();
  const { data: careers, loading, error, refetch } = useApiList<CareerAdmin>("/careers?lang=fr&pageSize=100");
  const { data: categories } = useApiOne<{ id: number; name: string }[]>("/career-categories?lang=fr");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CareerAdmin | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"all" | "en_cours" | "cloture">("all");
  const [filtreCategorie, setFiltreCategorie] = useState("all");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [page, setPage] = useState(1);

  const categoriesNoms = Array.from(new Set(careers.map((c) => c.category.name)));
  const aujourdhui = new Date().toISOString().slice(0, 10);

  function reinitialiser() {
    setRecherche("");
    setFiltreStatut("all");
    setFiltreCategorie("all");
    setDateDebut("");
    setDateFin("");
    setPage(1);
  }

  const resultat = careers.filter((c) => {
    const correspondRecherche = `${c.name} ${c.code} ${c.departement}`.toLocaleLowerCase("fr").includes(recherche.trim().toLocaleLowerCase("fr"));
    const enCours = c.limitDate.slice(0, 10) >= aujourdhui;
    const correspondStatut = filtreStatut === "all" || (filtreStatut === "en_cours" ? enCours : !enCours);
    const correspondCategorie = filtreCategorie === "all" || c.category.name === filtreCategorie;
    const date = c.publicationDate.slice(0, 10);
    const correspondDateDebut = !dateDebut || date >= dateDebut;
    const correspondDateFin = !dateFin || date <= dateFin;
    return correspondRecherche && correspondStatut && correspondCategorie && correspondDateDebut && correspondDateFin;
  });
  const totalPages = Math.max(1, Math.ceil(resultat.length / PAGE_SIZE_ADMIN));
  const pageCourante = Math.min(page, totalPages);
  const resultatPage = resultat.slice((pageCourante - 1) * PAGE_SIZE_ADMIN, pageCourante * PAGE_SIZE_ADMIN);
  const enCoursListe = careers.filter((c) => c.limitDate.slice(0, 10) >= aujourdhui);
  const cloturesListe = careers.filter((c) => c.limitDate.slice(0, 10) < aujourdhui);
  const totalCandidatures = careers.reduce((somme, c) => somme + c.candidatCount, 0);
  const nouveauxCetteSemaine = careers.filter((c) => depuisMoinsDuneSemaine(c.publicationDate)).length;

  function changerPage(p: number) {
    setPage(Math.min(Math.max(p, 1), totalPages));
  }

  function exporter(format: ExportFormat = "csv") {
    exporterTableau(format,
      `${t("csv.filenamePrefix")}-${new Date().toISOString().slice(0, 10)}.csv`,
      t.raw("csv.headers") as string[],
      resultat.map((c) => [c.code, c.name, c.departement, c.category.name, c.candidatCount, formaterDate(c.limitDate)]),
    );
  }

  function ouvrirCreation() {
    setEditing(null);
    setCategoryId("");
    setShowForm((v) => !v);
  }

  function ouvrirEdition(career: CareerAdmin) {
    setEditing(career);
    setCategoryId(String(career.category.id));
    setShowForm(true);
  }

  async function supprimer(career: CareerAdmin) {
    if (!(await confirm(t("confirmDelete", { name: career.name })))) return;
    try {
      await apiFetch(`/careers/${career.id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!categoryId) {
      setFormError(tCommon("requiredCategory"));
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
        toast.success(t("updated"));
      } else {
        await apiFetch("/careers", { method: "POST", body });
        toast.success(t("created"));
      }
      setShowForm(false);
      setEditing(null);
      setCategoryId("");
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
            <Briefcase className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => exporter("csv")} className="gap-1.5"><Download className="size-4" aria-hidden /> CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => exporter("pdf")} className="gap-1.5"><FileText className="size-4" aria-hidden /> PDF</Button>
          <Button size="sm" onClick={ouvrirCreation}>
            {showForm && !editing ? tCommon("cancel") : t("newOffer")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTrendCard icon={Briefcase} tone="primary" value={careers.length} label={t("stats.total")} delta={nouveauxCetteSemaine} />
        <StatTrendCard icon={Clock3} tone="warning" value={enCoursListe.length} label={t("stats.inProgress")} />
        <StatTrendCard icon={CheckCircle2} tone="success" value={cloturesListe.length} label={t("stats.closed")} />
        <StatTrendCard icon={Users} tone="primary" value={totalCandidatures} label={t("stats.candidatures")} />
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? t("editingTitle", { name: editing.name }) : t("newOfferTitle")}</p>
          <div className="grid gap-2">
            <Label htmlFor="cr-code">{t("fields.code")}</Label>
            <Input id="cr-code" name="code" required placeholder={t("fields.codePlaceholder")} defaultValue={editing?.code} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-name">{t("fields.position")}</Label>
            <Input id="cr-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cr-description">{t("fields.description")}</Label>
            <Textarea id="cr-description" name="descriptionFr" required rows={3} defaultValue={editing?.description} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-departement">{t("fields.department")}</Label>
            <Input id="cr-departement" name="departementFr" required defaultValue={editing?.departement} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-category">{tCommon("category")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="cr-category" aria-required="true">
                <SelectValue placeholder={tCommon("selectPlaceholder")} />
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
            <Label htmlFor="cr-location">{t("fields.location")}</Label>
            <Input id="cr-location" name="locationFr" placeholder={t("fields.locationPlaceholder")} defaultValue={editing?.location ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-salary">{t("fields.salary")}</Label>
            <Input id="cr-salary" name="salary" placeholder={t("fields.salaryOptional")} defaultValue={editing?.salary ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-pub">{t("fields.publicationDate")}</Label>
            <Input id="cr-pub" name="publicationDate" type="date" required defaultValue={editing?.publicationDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-limit">{t("fields.limitDate")}</Label>
            <Input id="cr-limit" name="limitDate" type="date" required defaultValue={editing?.limitDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-contact-name">{t("fields.contactName")}</Label>
            <Input id="cr-contact-name" name="contactName" required defaultValue={editing?.contactName} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-contact-email">{t("fields.contactEmail")}</Label>
            <Input id="cr-contact-email" name="contactEmail" type="email" required defaultValue={editing?.contactEmail} />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? tCommon("saving") : editing ? tCommon("save") : t("newOfferTitle")}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                {tCommon("cancel")}
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid gap-3 border-b border-border bg-surface/55 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_9rem_10rem_9rem_9rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={recherche}
              onChange={(event) => { setRecherche(event.target.value); setPage(1); }}
              className="h-9 bg-card pl-9 text-xs"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Select value={filtreStatut} onValueChange={(value) => { setFiltreStatut(value as typeof filtreStatut); setPage(1); }}>
            <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon("allStatuses")}</SelectItem>
              <SelectItem value="en_cours">{t("statusInProgress")}</SelectItem>
              <SelectItem value="cloture">{t("statusClosed")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtreCategorie} onValueChange={(value) => { setFiltreCategorie(value); setPage(1); }}>
            <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon("allCategories")}</SelectItem>
              {categoriesNoms.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateDebut} onChange={(event) => { setDateDebut(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("startDate")} />
          <Input type="date" value={dateFin} onChange={(event) => { setDateFin(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("endDate")} />
          <Button type="button" size="sm" variant="ghost" onClick={reinitialiser} className="justify-self-start text-xs lg:justify-self-end">
            {tCommon("reset")}
          </Button>
        </div>

        <TableauAdmin
          compact
          colonnes={[t("columns.reference"), t("columns.position"), t("columns.department"), t("columns.limitDate"), t("columns.candidates"), t("columns.publication"), tCommon("actions")]}
          lignes={resultatPage.map((c) => [
            c.code,
            c.name,
            c.departement,
            formaterDate(c.limitDate),
            c.candidatCount,
            c.isNew ? <Puce key={c.id} label={t("isNew")} tone="info" /> : <Puce key={c.id} label={t("published")} tone="success" />,
            <RowActions key={c.id} onEdit={() => ouvrirEdition(c)} onDelete={() => supprimer(c)} />,
          ])}
        />
        {resultatPage.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted-foreground">{t("noResults")}</p>}

        <PaginationAdmin page={pageCourante} totalItems={resultat.length} pageSize={PAGE_SIZE_ADMIN} onPageChange={changerPage} />
      </div>
    </section>
  );
}

function StatistiquesAdmin() {
  const t = useTranslations("admin.statistics");
  const tCommon = useTranslations("admin.common");
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

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
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
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("kpi.mobileSubscribers")}</p>
          <p className="mt-3 font-heading text-2xl font-bold text-primary">{overview.kpis?.subscribersMillion != null ? `${overview.kpis.subscribersMillion} M` : "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("kpi.penetrationRate")}</p>
          <p className="mt-3 font-heading text-2xl font-bold text-primary">{overview.kpis?.penetrationRate != null ? `${overview.kpis.penetrationRate} %` : "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("kpi.activeOperators")}</p>
          <p className="mt-3 font-heading text-2xl font-bold text-primary">{overview.kpis?.activeOperators ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("kpi.active4GSites")}</p>
          <p className="mt-3 font-heading text-2xl font-bold text-primary">{overview.kpis?.active4GSites != null ? overview.kpis.active4GSites.toLocaleString("fr-FR") : "—"}</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
        <h2 className="font-heading text-lg font-semibold">{t("chart.title")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("chart.subtitle")}</p>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={abonnesParMoisReel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", fontSize: "0.8rem" }} />
              <Bar dataKey="abonnes" name={t("chart.seriesName")} fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <PointsStatistiquesAdmin />
      {!loadingReports && (
        <TableauAdmin
          codeColumn={false}
          colonnes={t.raw("reports.columns") as string[]}
          lignes={reports.map((r) => [
            r.title,
            r.sector,
            r.year,
            r.format,
            r.downloadCount.toLocaleString("fr-FR"),
            <a key={r.id} href={r.fileUrl} data-document-preview target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
              {t("reports.open")}
            </a>,
          ])}
        />
      )}
    </div>
  );
}

interface SectorStatisticEntry {
  id: number;
  year: number;
  month: number | null;
  quarter: number | null;
  subscribersMillion: number | null;
  penetrationRate: number | null;
  activeOperators: number | null;
  active4GSites: number | null;
  internetSubscribersMillion: number | null;
  internetPenetrationRate: number | null;
  mobileMoneyPenetrationRate: number | null;
  salariedJobs: number | null;
  revenueBillionGNF: number | null;
}

const STAT_NUMBER_FIELDS = [
  "subscribersMillion",
  "penetrationRate",
  "activeOperators",
  "active4GSites",
  "internetSubscribersMillion",
  "internetPenetrationRate",
  "mobileMoneyPenetrationRate",
  "salariedJobs",
  "revenueBillionGNF",
] as const;

/**
 * Formulaire créer/modifier un point statistique — un point est soit mensuel
 * (abonnés, pénétration, opérateurs actifs, sites 4G...) soit trimestriel
 * (chiffre d'affaires), jamais les deux à la fois, voir le commentaire du
 * modèle SectorStatistic côté backend. Tous les champs numériques sont
 * optionnels : laisser un champ vide n'envoie pas la clé plutôt que 0, pour
 * ne pas écraser une valeur existante par une fausse donnée à 0.
 */
function PointStatistiqueForm({
  entry,
  onDone,
  onCancel,
}: {
  entry: SectorStatisticEntry | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("admin.statistics");
  const tCommon = useTranslations("admin.common");
  const [periodeType, setPeriodeType] = useState<"month" | "quarter">(entry?.quarter ? "quarter" : "month");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function enregistrer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = new FormData(event.currentTarget);
    const nombre = (name: string) => {
      const valeur = form.get(name);
      return valeur !== null && String(valeur).trim() !== "" ? Number(valeur) : undefined;
    };

    const body: Record<string, unknown> = {
      year: Number(form.get("year")),
      month: periodeType === "month" ? Number(form.get("month")) : null,
      quarter: periodeType === "quarter" ? Number(form.get("quarter")) : null,
    };
    for (const champ of STAT_NUMBER_FIELDS) body[champ] = nombre(champ);

    setSubmitting(true);
    try {
      if (entry) {
        await apiFetch(`/statistics/entries/${entry.id}`, { method: "PATCH", body: JSON.stringify(body) });
        toast.success(t("form.updated"));
      } else {
        await apiFetch("/statistics/entries", { method: "POST", body: JSON.stringify(body) });
        toast.success(t("form.created"));
      }
      onDone();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-4 rounded-xl border border-primary/15 bg-surface p-5 shadow-soft">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="stat-year">{t("form.year")}</Label>
          <Input id="stat-year" name="year" type="number" required min={2000} defaultValue={entry?.year} />
        </div>
        <div className="grid gap-2">
          <Label>{t("form.periodType")}</Label>
          <Select value={periodeType} onValueChange={(v) => setPeriodeType(v as "month" | "quarter")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">{t("form.periodMonth")}</SelectItem>
              <SelectItem value="quarter">{t("form.periodQuarter")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {periodeType === "month" ? (
          <div className="grid gap-2">
            <Label htmlFor="stat-month">{t("form.month")}</Label>
            <Select name="month" defaultValue={entry?.month ? String(entry.month) : undefined} required>
              <SelectTrigger id="stat-month">
                <SelectValue placeholder={t("form.selectMonth")} />
              </SelectTrigger>
              <SelectContent>
                {MOIS_COURTS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="stat-quarter">{t("form.quarter")}</Label>
            <Select name="quarter" defaultValue={entry?.quarter ? String(entry.quarter) : undefined} required>
              <SelectTrigger id="stat-quarter">
                <SelectValue placeholder={t("form.selectQuarter")} />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((q) => (
                  <SelectItem key={q} value={String(q)}>
                    T{q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {periodeType === "month" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="stat-subscribersMillion">{t("form.mobileSubscribers")}</Label>
            <Input id="stat-subscribersMillion" name="subscribersMillion" type="number" step="0.1" min={0} defaultValue={entry?.subscribersMillion ?? undefined} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stat-penetrationRate">{t("form.mobilePenetration")}</Label>
            <Input id="stat-penetrationRate" name="penetrationRate" type="number" step="0.1" min={0} defaultValue={entry?.penetrationRate ?? undefined} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stat-internetSubscribersMillion">{t("form.internetSubscribers")}</Label>
            <Input id="stat-internetSubscribersMillion" name="internetSubscribersMillion" type="number" step="0.1" min={0} defaultValue={entry?.internetSubscribersMillion ?? undefined} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stat-internetPenetrationRate">{t("form.internetPenetration")}</Label>
            <Input id="stat-internetPenetrationRate" name="internetPenetrationRate" type="number" step="0.1" min={0} defaultValue={entry?.internetPenetrationRate ?? undefined} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stat-mobileMoneyPenetrationRate">{t("form.mobileMoneyPenetration")}</Label>
            <Input id="stat-mobileMoneyPenetrationRate" name="mobileMoneyPenetrationRate" type="number" step="0.1" min={0} defaultValue={entry?.mobileMoneyPenetrationRate ?? undefined} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stat-salariedJobs">{t("form.salariedJobs")}</Label>
            <Input id="stat-salariedJobs" name="salariedJobs" type="number" min={0} defaultValue={entry?.salariedJobs ?? undefined} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stat-activeOperators">{t("form.activeOperators")}</Label>
            <Input id="stat-activeOperators" name="activeOperators" type="number" min={0} defaultValue={entry?.activeOperators ?? undefined} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stat-active4GSites">{t("form.active4GSites")}</Label>
            <Input id="stat-active4GSites" name="active4GSites" type="number" min={0} defaultValue={entry?.active4GSites ?? undefined} />
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:max-w-xs">
          <Label htmlFor="stat-revenueBillionGNF">{t("form.revenue")}</Label>
          <Input id="stat-revenueBillionGNF" name="revenueBillionGNF" type="number" step="0.1" min={0} defaultValue={entry?.revenueBillionGNF ?? undefined} />
        </div>
      )}

      {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? tCommon("saving") : entry ? tCommon("save") : t("form.createEntry")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}

function PointsStatistiquesAdmin() {
  const t = useTranslations("admin.statistics");
  const tCommon = useTranslations("admin.common");
  const { data: entries, loading, error, refetch } = useApiOne<SectorStatisticEntry[]>("/statistics/entries");
  const [editing, setEditing] = useState<SectorStatisticEntry | "new" | null>(null);
  const confirm = useConfirm();

  async function supprimer(id: number) {
    if (!(await confirm(t("entries.confirmDelete")))) return;
    try {
      await apiFetch(`/statistics/entries/${id}`, { method: "DELETE" });
      toast.success(t("entries.deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t("entries.title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("entries.subtitle")}
          </p>
        </div>
        {editing === null && (
          <Button size="sm" onClick={() => setEditing("new")}>
            {t("entries.newEntry")}
          </Button>
        )}
      </div>

      {editing !== null && (
        <div className="mt-4">
          <PointStatistiqueForm
            entry={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              refetch();
            }}
          />
        </div>
      )}

      <TableauAdmin
        codeColumn={false}
        colonnes={[t("entries.columns.period"), t("entries.columns.mobileSubscribers"), t("entries.columns.mobilePenetration"), t("entries.columns.internetSubscribers"), t("entries.columns.mobileMoney"), t("entries.columns.jobs"), tCommon("actions")]}
        lignes={(entries ?? []).map((e) => [
          e.month ? `${MOIS_COURTS[e.month - 1]} ${e.year}` : `T${e.quarter} ${e.year}`,
          e.subscribersMillion != null ? `${e.subscribersMillion} M` : "—",
          e.penetrationRate != null ? `${e.penetrationRate} %` : "—",
          e.internetSubscribersMillion != null ? `${e.internetSubscribersMillion} M` : "—",
          e.mobileMoneyPenetrationRate != null ? `${e.mobileMoneyPenetrationRate} %` : "—",
          e.salariedJobs != null ? e.salariedJobs.toLocaleString("fr-FR") : "—",
          <div key={e.id} className="flex items-center gap-3">
            <button type="button" onClick={() => setEditing(e)} className="text-xs font-medium text-primary hover:underline">
              {tCommon("edit")}
            </button>
            <button type="button" onClick={() => supprimer(e.id)} className="text-xs font-medium text-destructive hover:underline">
              {tCommon("delete")}
            </button>
          </div>,
        ])}
      />
      {(entries ?? []).length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">{t("entries.noResults")}</p>
      )}
    </div>
  );
}

interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  textPrimary?: string;
  textSecondary?: string;
  success?: string;
  warning?: string;
  danger?: string;
}

/** Miroir de DEFAULT_SITE_SETTING.themeColors (backend-nest/src/site-config/site-config.service.ts) — équivalents hex du thème institutionnel oklch() de globals.css, sert de repli d'affichage et de valeurs pour le bouton "Réinitialiser". */
const DEFAULT_THEME_COLORS: Required<ThemeColors> = {
  primary: "#014F88",
  secondary: "#EAF1F8",
  accent: "#CEEFF5",
  background: "#FCFEFF",
  surface: "#F1F6FB",
  textPrimary: "#101926",
  textSecondary: "#606A76",
  success: "#368E5B",
  warning: "#E49E38",
  danger: "#CC2827",
};

const THEME_COLOR_FIELDS: (keyof ThemeColors)[] = [
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "danger",
  "background",
  "surface",
  "textPrimary",
  "textSecondary",
];

interface SiteConfig {
  contactInfo: { address?: { fr?: string }; phone?: string; phoneSecondary?: string; email?: string; hours?: { fr?: string } };
  socialLinks: { facebook?: string; twitter?: string; linkedin?: string; youtube?: string; instagram?: string };
  footerText: { fr?: string };
  themeColors?: ThemeColors;
  logoKey?: string | null;
}

function ConfigurationAdmin() {
  const tCommon = useTranslations("admin.common");
  const { data: config, loading, error, refetch } = useApiOne<SiteConfig>("/site-config");

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;
  if (!config) return null;

  return <ConfigurationInner initialValue={config} onSaved={refetch} />;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 font-mono text-xs uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function ConfigurationInner({ initialValue, onSaved }: { initialValue: SiteConfig; onSaved: () => void }) {
  const t = useTranslations("admin.config");
  const tAppearance = useTranslations("admin.config.appearance");
  const tCommon = useTranslations("admin.common");
  const [submitting, setSubmitting] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [logoKey, setLogoKey] = useState(initialValue.logoKey ?? "");
  const [colors, setColors] = useState<Required<ThemeColors>>({ ...DEFAULT_THEME_COLORS, ...initialValue.themeColors });

  function setColor(field: keyof ThemeColors, value: string) {
    setColors((prev) => ({ ...prev, [field]: value }));
  }

  function reinitialiserCouleurs() {
    setColors(DEFAULT_THEME_COLORS);
    toast.success(tAppearance("colorsReset"));
  }

  async function enregistrer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = {
      contactInfo: {
        phone: String(form.get("phone") || ""),
        phoneSecondary: String(form.get("phoneSecondary") || ""),
        ...(String(form.get("email") || "").trim() ? { email: String(form.get("email")).trim() } : {}),
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
      toast.success(t("saved"));
      onSaved();
      window.dispatchEvent(new Event("arpt:site-config-updated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function enregistrerApparence() {
    setSavingAppearance(true);
    try {
      await apiFetch("/site-config", { method: "PATCH", body: JSON.stringify({ logoKey: logoKey || null, themeColors: colors }) });
      toast.success(t("saved"));
      onSaved();
      window.dispatchEvent(new Event("arpt:site-config-updated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSavingAppearance(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="mt-8 grid max-w-2xl gap-5 rounded-xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cfg-phone">{t("phone")}</Label>
          <Input id="cfg-phone" name="phone" defaultValue={initialValue.contactInfo?.phone ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-phone2">{t("phoneSecondary")}</Label>
          <Input id="cfg-phone2" name="phoneSecondary" defaultValue={initialValue.contactInfo?.phoneSecondary ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-email">{t("email")}</Label>
          <Input id="cfg-email" name="email" type="email" defaultValue={initialValue.contactInfo?.email ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-address">{t("address")}</Label>
          <Input id="cfg-address" name="address" defaultValue={initialValue.contactInfo?.address?.fr ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-hours">{t("hours")}</Label>
          <Input id="cfg-hours" name="hours" defaultValue={initialValue.contactInfo?.hours?.fr ?? ""} placeholder={t("hoursPlaceholder")} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cfg-fb">Facebook</Label>
          <Input id="cfg-fb" name="facebook" defaultValue={initialValue.socialLinks?.facebook ?? ""} placeholder="https://facebook.com/…" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-tw">X (Twitter)</Label>
          <Input id="cfg-tw" name="twitter" defaultValue={initialValue.socialLinks?.twitter ?? ""} placeholder="https://x.com/…" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-li">LinkedIn</Label>
          <Input id="cfg-li" name="linkedin" defaultValue={initialValue.socialLinks?.linkedin ?? ""} placeholder="https://linkedin.com/…" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cfg-yt">YouTube</Label>
          <Input id="cfg-yt" name="youtube" defaultValue={initialValue.socialLinks?.youtube ?? ""} placeholder="https://youtube.com/…" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cfg-footer">{t("footerText")}</Label>
        <Input id="cfg-footer" name="footerText" defaultValue={initialValue.footerText?.fr ?? ""} />
      </div>

      <div className="mt-2 border-t border-border pt-5">
        <h3 className="font-heading text-base font-semibold">{tAppearance("title")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{tAppearance("subtitle")}</p>

        <div className="mt-4 max-w-xs">
          <ImageField label={tAppearance("logo")} value={logoKey} onChange={setLogoKey} />
          <p className="mt-1.5 text-xs text-muted-foreground">{tAppearance("logoHint")}</p>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium">{tAppearance("colorsTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{tAppearance("colorsHint")}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {THEME_COLOR_FIELDS.map((field) => (
              <ColorField key={field} label={tAppearance(field)} value={colors[field]} onChange={(value) => setColor(field, value)} />
            ))}
          </div>
          <button type="button" onClick={reinitialiserCouleurs} className="mt-3 text-xs font-semibold text-primary hover:underline">
            {tAppearance("resetColors")}
          </button>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium text-muted-foreground">{tAppearance("preview")}</p>
          <div
            className="mt-2 overflow-hidden rounded-xl border"
            style={{ background: colors.background, borderColor: colors.surface }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ background: colors.primary }}>
              <span className="text-sm font-semibold" style={{ color: "#fff" }}>ARPT Guinée</span>
              <span className="rounded-md px-2 py-1 text-xs font-semibold" style={{ background: colors.accent, color: colors.textPrimary }}>
                {tAppearance("accent")}
              </span>
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{tAppearance("textPrimary")}</p>
              <p className="mt-1 text-xs" style={{ color: colors.textSecondary }}>{tAppearance("textSecondary")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: colors.secondary, color: colors.textPrimary }}>{tAppearance("secondary")}</span>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: colors.success, color: "#fff" }}>{tAppearance("success")}</span>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: colors.warning, color: "#fff" }}>{tAppearance("warning")}</span>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: colors.danger, color: "#fff" }}>{tAppearance("danger")}</span>
              </div>
            </div>
          </div>
        </div>
        <Button type="button" onClick={enregistrerApparence} disabled={savingAppearance} className="mt-5">
          {savingAppearance ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>

      <Button type="submit" disabled={submitting} className="mt-2 justify-self-start">
        {submitting ? tCommon("saving") : tCommon("save")}
      </Button>
    </form>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const t = useTranslations("admin.config");
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
      toast.error(err instanceof ApiError ? err.message : t("imageUploadError"));
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
      {uploading && <p className="text-xs text-muted-foreground">{t("uploading")}</p>}
    </div>
  );
}

function FileField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const t = useTranslations("admin.config");
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
      toast.error(err instanceof ApiError ? err.message : t("fileUploadError"));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      {value && (
        <a href={value} data-document-preview target="_blank" rel="noreferrer" className="text-sm text-primary underline">
          {t("viewCurrentFile")}
        </a>
      )}
      <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" disabled={uploading} onChange={envoyer} />
      {uploading && <p className="text-xs text-muted-foreground">{t("uploading")}</p>}
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
  const tCommon = useTranslations("admin.common");
  const { data, loading } = useContentBlockRaw<BlockItem>(blockKey, defaultValue);
  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;
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
  const tCommon = useTranslations("admin.common");
  const [value, setValue] = useState<BlockItem>(initialValue);
  const [submitting, setSubmitting] = useState(false);

  async function enregistrer() {
    setSubmitting(true);
    try {
      await apiFetch(`/content-blocks/${blockKey}`, { method: "PUT", body: JSON.stringify({ value }) });
      toast.success(tCommon("savedContent"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
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
        {submitting ? tCommon("saving") : tCommon("save")}
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
  const tCommon = useTranslations("admin.common");
  const { data, loading } = useContentBlockRaw<BlockItem[]>(blockKey, defaultItems);
  if (loading) return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>;
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
  const tCommon = useTranslations("admin.common");
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
      toast.success(tCommon("savedContent"));
      setItems(nonVides);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
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
          {tCommon("add")}
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
        {items.length === 0 && <p className="text-sm text-muted-foreground">{tCommon("noItemsClickAdd")}</p>}
      </div>
      <Button type="button" size="sm" className="mt-5" disabled={submitting} onClick={enregistrer}>
        {submitting ? tCommon("saving") : tCommon("save")}
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
  const t = useTranslations("admin.publicPages.guide");
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
      toast.success(t("updated"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("uploadError"));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-heading text-base font-semibold">{t("title")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("subtitle")}
      </p>
      {!loading && data?.fileUrl && (
        <a href={data.fileUrl} data-document-preview target="_blank" rel="noreferrer" className="mt-3 block text-sm text-primary underline">
          {t("viewCurrent")}
        </a>
      )}
      <Input type="file" accept=".pdf" disabled={uploading} onChange={envoyer} className="mt-3" />
      {uploading && <p className="mt-1 text-xs text-muted-foreground">{t("uploading")}</p>}
    </div>
  );
}

function PagesPubliquesAdmin() {
  const t = useTranslations("admin.publicPages");
  const [pageSelectionnee, setPageSelectionnee] = useState("home");
  const pages = [
    "home", "about", "claims", "regulation", "equipment", "tenders",
    "careers", "news", "services", "contact", "statistics", "consultations",
  ];

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700"><LayoutTemplate className="size-5" aria-hidden /></span>
            <div>
              <p className="font-heading text-xs font-semibold tracking-[0.15em] text-primary uppercase">{t("editorTitle")}</p>
              <h2 className="mt-1 font-heading text-xl font-semibold">{t("title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("selectPageHint")}</p>
            </div>
          </div>
          <div className="grid gap-1.5 sm:min-w-72">
            <Label htmlFor="public-page-select" className="text-xs">{t("pageLabel")}</Label>
            <Select value={pageSelectionnee} onValueChange={setPageSelectionnee}>
              <SelectTrigger id="public-page-select" className="bg-surface"><SelectValue /></SelectTrigger>
              <SelectContent>
                {pages.map((page) => <SelectItem key={page} value={page}>{t(`pages.${page}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {pageSelectionnee === "home" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.home`)}</p>
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
        </section>}

        {pageSelectionnee === "about" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.about`)}</p>
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
        </section>}

        {pageSelectionnee === "claims" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.claims`)}</p>
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
            <ListBlockAdmin
              blockKey="claims.types"
              title="Natures de réclamation"
              description="La liste déroulante « Nature de la réclamation » du formulaire."
              itemLabel={(it) => blockLabel(it.label) || "Nouvelle nature"}
              fields={[
                { name: "value", label: "Identifiant (sans espace)", type: "text" },
                { name: "label", label: "Nom affiché", type: "text", translatable: true },
              ]}
              defaultItems={[
                { value: "qualite", label: { fr: "Qualité de service", en: "Quality of service", ar: "جودة الخدمة" } },
                { value: "facturation", label: { fr: "Facturation", en: "Billing", ar: "الفوترة" } },
                { value: "reseau", label: { fr: "Réseau / couverture", en: "Network / coverage", ar: "الشبكة / التغطية" } },
                { value: "autre", label: { fr: "Autre", en: "Other", ar: "أخرى" } },
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
        </section>}

        {pageSelectionnee === "regulation" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.regulation`)}</p>
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
        </section>}

        {pageSelectionnee === "equipment" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.equipment`)}</p>
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
        </section>}

        {pageSelectionnee === "tenders" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.tenders`)}</p>
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
        </section>}

        {pageSelectionnee === "careers" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.careers`)}</p>
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
        </section>}

        {pageSelectionnee === "news" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.news`)}</p>
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
        </section>}

        {pageSelectionnee === "services" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.services`)}</p>
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
        </section>}

        {pageSelectionnee === "contact" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.contact`)}</p>
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
        </section>}

        {pageSelectionnee === "statistics" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.statistics`)}</p>
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
        </section>}

        {pageSelectionnee === "consultations" && <section>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`pages.consultations`)}</p>
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
        </section>}
      </div>
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
  const t = useTranslations("admin.news");
  const tCommon = useTranslations("admin.common");
  const confirm = useConfirm();
  const { data: news, loading, error, refetch } = useApiList<NewsAdmin>("/news?lang=fr&pageSize=100");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsAdmin | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("all");
  const [statut, setStatut] = useState<"all" | "published" | "draft">("all");
  const [ordre, setOrdre] = useState<"recent" | "views">("recent");

  const categories = Array.from(new Set(news.map((item) => item.category).filter((item): item is string => Boolean(item))));
  const actualitesFiltrees = news
    .filter((item) => {
      const correspondRecherche = `${item.title} ${item.content} ${item.category ?? ""}`.toLocaleLowerCase("fr").includes(recherche.trim().toLocaleLowerCase("fr"));
      const correspondCategorie = categorie === "all" || item.category === categorie;
      const correspondStatut = statut === "all" || (statut === "published" ? item.isPublished : !item.isPublished);
      return correspondRecherche && correspondCategorie && correspondStatut;
    })
    .sort((a, b) => ordre === "views" ? b.views - a.views : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
    if (!(await confirm(t("confirmDelete", { name: n.title })))) return;
    try {
      await apiFetch(`/news/${n.id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  }

  function exporter(format: ExportFormat = "csv") {
    exporterTableau(format, t("csv.filename"), t.raw("csv.headers") as string[], actualitesFiltrees.map((item) => [item.title, item.category ?? "", formaterDate(item.createdAt), item.views, item.isPublished ? t("statusPublished") : t("statusDraft")]));
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = new FormData(event.currentTarget);
    const image = form.get("image") as File;
    if (!editing && (!image || image.size === 0)) {
      setFormError(t("imageRequired"));
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
        toast.success(t("updated"));
      } else {
        await apiFetch("/news", { method: "POST", body });
        toast.success(t("created"));
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700"><Newspaper className="size-5" aria-hidden /></span>
            <div><h2 className="font-heading text-xl font-semibold">{t("title")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => exporter("csv")}><Download className="size-4" aria-hidden /> CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => exporter("pdf")} className="gap-1.5"><FileText className="size-4" aria-hidden /> PDF</Button>
            <Button size="sm" onClick={ouvrirCreation}>{showForm && !editing ? tCommon("cancel") : t("newArticle")}</Button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-border bg-surface/55 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(13rem,1fr)_10rem_10rem_9rem] lg:p-5">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input value={recherche} onChange={(event) => setRecherche(event.target.value)} className="h-9 bg-card pl-9 text-xs" placeholder={t("searchPlaceholder")} /></div>
          <Select value={categorie} onValueChange={setCategorie}><SelectTrigger className="h-9 bg-card text-xs"><SelectValue placeholder={tCommon("allCategories")} /></SelectTrigger><SelectContent><SelectItem value="all">{tCommon("allCategories")}</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={statut} onValueChange={(value) => setStatut(value as typeof statut)}><SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{tCommon("allStatuses")}</SelectItem><SelectItem value="published">{t("statusPublished")}</SelectItem><SelectItem value="draft">{t("statusDraft")}</SelectItem></SelectContent></Select>
          <Select value={ordre} onValueChange={(value) => setOrdre(value as typeof ordre)}><SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">{t("sortRecent")}</SelectItem><SelectItem value="views">{t("sortViews")}</SelectItem></SelectContent></Select>
        </div>

        {showForm && (
          <form key={editing?.id ?? "new"} onSubmit={soumettre} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">{editing ? t("editingTitle", { name: editing.title }) : t("newArticleTitle")}</p>
            <div className="grid gap-2">
              <Label htmlFor="news-title">{t("fields.articleTitle")}</Label>
              <Input id="news-title" name="titleFr" required defaultValue={editing?.title} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="news-content">{t("fields.content")}</Label>
              <Textarea id="news-content" name="contentFr" required rows={6} defaultValue={editing?.content} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="news-category">{t("fields.category")}</Label>
              <Input id="news-category" name="category" placeholder={t("fields.categoryPlaceholder")} defaultValue={editing?.category ?? ""} />
            </div>
            {editing?.imageUrl && (
              <img src={editing.imageUrl} alt="" className="h-32 w-auto rounded-lg border border-border object-cover" />
            )}
            <div className="grid gap-2">
              <Label htmlFor="news-image">{t("fields.image", { hint: editing ? t("fields.imageHintKeep") : "*" })}</Label>
              <Input id="news-image" name="image" type="file" accept="image/*" required={!editing} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              {t("fields.publishImmediately")}
            </label>
            {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="justify-self-start">
                {submitting ? tCommon("saving") : editing ? tCommon("save") : t("newArticleTitle")}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                  {tCommon("cancel")}
                </Button>
              )}
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[55rem] text-left text-sm">
            <thead className="border-b border-border bg-card text-[10px] font-semibold tracking-wide text-muted-foreground uppercase"><tr><th className="px-5 py-3">{t("columns.title")}</th><th className="px-4 py-3">{t("columns.category")}</th><th className="px-4 py-3">{t("columns.date")}</th><th className="px-4 py-3">{t("columns.views")}</th><th className="px-4 py-3">{t("columns.status")}</th><th className="px-5 py-3 text-right">{tCommon("actions")}</th></tr></thead>
            <tbody className="divide-y divide-border">
              {actualitesFiltrees.map((n) => (
                <tr key={n.id} className="transition-colors hover:bg-accent/25">
                  <td className="px-5 py-3.5"><div className="flex max-w-lg items-center gap-3"><div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">{n.imageUrl && <img src={n.imageUrl} alt="" className="size-full object-cover" />}</div><div className="min-w-0"><p className="line-clamp-1 text-xs font-semibold">{n.title}</p><p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{n.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}</p><button type="button" onClick={() => window.open(`/actualites/${n.uid}`, "_blank", "noopener,noreferrer")} className="mt-1 text-[10px] font-semibold text-primary hover:underline">{t("readMore")}</button></div></div></td>
                  <td className="px-4 py-3.5">{n.category ? <span className="inline-flex rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground">{n.category}</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground"><p>{formaterDate(n.createdAt)}</p></td>
                  <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Eye className="size-3.5" aria-hidden />{n.views.toLocaleString("fr-FR")}</span></td>
                  <td className="px-4 py-3.5">{n.isPublished ? <Puce label={t("statusPublished")} tone="success" /> : <Puce label={t("statusDraft")} tone="warning" />}</td>
                  <td className="px-5 py-3.5"><div className="flex justify-end gap-1"><button type="button" onClick={() => ouvrirEdition(n)} title={tCommon("edit")} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-primary"><Pencil className="size-3.5" aria-hidden /></button><button type="button" onClick={() => window.open(`/actualites/${n.uid}`, "_blank", "noopener,noreferrer")} title={t("viewOnSite")} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-primary"><Eye className="size-3.5" aria-hidden /></button><button type="button" onClick={() => supprimer(n)} title={tCommon("delete")} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3.5" aria-hidden /></button></div></td>
                </tr>
              ))}
              {actualitesFiltrees.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">{t("noResults")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
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
  const t = useTranslations("admin.communiques");
  const tCommon = useTranslations("admin.common");
  const confirm = useConfirm();
  const { data: communiques, loading, error, refetch } = useApiList<CommuniqueAdmin>("/communiques?lang=fr&pageSize=100");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CommuniqueAdmin | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [recherche, setRecherche] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [page, setPage] = useState(1);

  function reinitialiser() {
    setRecherche("");
    setDateDebut("");
    setDateFin("");
    setPage(1);
  }

  const resultat = communiques.filter((c) => {
    const correspondRecherche = c.title.toLocaleLowerCase("fr").includes(recherche.trim().toLocaleLowerCase("fr"));
    const date = c.createdAt.slice(0, 10);
    const correspondDateDebut = !dateDebut || date >= dateDebut;
    const correspondDateFin = !dateFin || date <= dateFin;
    return correspondRecherche && correspondDateDebut && correspondDateFin;
  });
  const totalPages = Math.max(1, Math.ceil(resultat.length / PAGE_SIZE_ADMIN));
  const pageCourante = Math.min(page, totalPages);
  const resultatPage = resultat.slice((pageCourante - 1) * PAGE_SIZE_ADMIN, pageCourante * PAGE_SIZE_ADMIN);
  const avecPieceJointe = communiques.filter((c) => c.fileUrl).length;
  const nouveauxCetteSemaine = communiques.filter((c) => depuisMoinsDuneSemaine(c.createdAt)).length;

  function changerPage(p: number) {
    setPage(Math.min(Math.max(p, 1), totalPages));
  }

  function exporter(format: ExportFormat = "csv") {
    exporterTableau(format,
      `${t("csv.filenamePrefix")}-${new Date().toISOString().slice(0, 10)}.csv`,
      t.raw("csv.headers") as string[],
      resultat.map((c) => [c.title, c.fileUrl ? t("csv.yes") : t("csv.no"), formaterDate(c.createdAt)]),
    );
  }

  function ouvrirCreation() {
    setEditing(null);
    setShowForm((v) => !v);
  }

  function ouvrirEdition(c: CommuniqueAdmin) {
    setEditing(c);
    setShowForm(true);
  }

  async function supprimer(c: CommuniqueAdmin) {
    if (!(await confirm(t("confirmDelete", { name: c.title })))) return;
    try {
      await apiFetch(`/communiques/${c.id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
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
        toast.success(t("updated"));
      } else {
        await apiFetch("/communiques", { method: "POST", body });
        toast.success(t("created"));
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
            <FileCheck2 className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => exporter("csv")} className="gap-1.5"><Download className="size-4" aria-hidden /> CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => exporter("pdf")} className="gap-1.5"><FileText className="size-4" aria-hidden /> PDF</Button>
          <Button size="sm" onClick={ouvrirCreation}>
            {showForm && !editing ? tCommon("cancel") : t("newRelease")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTrendCard icon={FileCheck2} tone="primary" value={communiques.length} label={t("stats.total")} delta={nouveauxCetteSemaine} />
        <StatTrendCard icon={Paperclip} tone="success" value={avecPieceJointe} label={t("stats.withAttachment")} />
        <StatTrendCard icon={FileText} tone="warning" value={communiques.length - avecPieceJointe} label={t("stats.withoutAttachment")} />
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="grid gap-4 rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">{editing ? t("editingTitle", { name: editing.title }) : t("newReleaseTitle")}</p>
          <div className="grid gap-2">
            <Label htmlFor="com-title">{t("fields.title")}</Label>
            <Input id="com-title" name="titleFr" required defaultValue={editing?.title} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="com-content">{t("fields.content")}</Label>
            <Textarea id="com-content" name="contentFr" required rows={5} defaultValue={editing?.content} />
          </div>
          {editing?.fileUrl && (
            <a href={editing.fileUrl} data-document-preview target="_blank" rel="noreferrer" className="text-sm text-primary underline">
              {t("viewCurrentDocument")}
            </a>
          )}
          <div className="grid gap-2">
            <Label htmlFor="com-file">{t("fields.file", { hint: editing ? t("fields.fileHintKeep") : t("fields.fileHintOptional") })}</Label>
            <Input id="com-file" name="file" type="file" accept=".pdf" />
          </div>
          {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? tCommon("saving") : editing ? tCommon("save") : t("newReleaseTitle")}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                {tCommon("cancel")}
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid gap-3 border-b border-border bg-surface/55 p-4 sm:grid-cols-3 lg:grid-cols-[minmax(12rem,1fr)_9rem_9rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={recherche}
              onChange={(event) => { setRecherche(event.target.value); setPage(1); }}
              className="h-9 bg-card pl-9 text-xs"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Input type="date" value={dateDebut} onChange={(event) => { setDateDebut(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("startDate")} />
          <Input type="date" value={dateFin} onChange={(event) => { setDateFin(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("endDate")} />
          <Button type="button" size="sm" variant="ghost" onClick={reinitialiser} className="justify-self-start text-xs lg:justify-self-end">
            {tCommon("reset")}
          </Button>
        </div>

        <TableauAdmin
          compact
          codeColumn={false}
          colonnes={[t("columns.title"), t("columns.date"), tCommon("actions")]}
          lignes={resultatPage.map((c) => [
            c.title,
            formaterDate(c.createdAt),
            <RowActions key={c.id} onEdit={() => ouvrirEdition(c)} onDelete={() => supprimer(c)} />,
          ])}
        />
        {resultatPage.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted-foreground">{t("noResults")}</p>}

        <PaginationAdmin page={pageCourante} totalItems={resultat.length} pageSize={PAGE_SIZE_ADMIN} onPageChange={changerPage} />
      </div>
    </section>
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
  createdAt: string;
}

function ServicesAdmin() {
  const t = useTranslations("admin.services");
  const tCommon = useTranslations("admin.common");
  const confirm = useConfirm();
  const { data: services, loading, error, refetch } = useApiList<ServiceAdmin>("/services?lang=fr&pageSize=100");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceAdmin | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreEtat, setFiltreEtat] = useState<"all" | "actif" | "inactif">("all");
  const [page, setPage] = useState(1);

  function reinitialiser() {
    setRecherche("");
    setFiltreEtat("all");
    setPage(1);
  }

  const resultat = services.filter((s) => {
    const correspondRecherche = `${s.name} ${s.description ?? ""}`.toLocaleLowerCase("fr").includes(recherche.trim().toLocaleLowerCase("fr"));
    const correspondEtat = filtreEtat === "all" || (filtreEtat === "actif" ? s.isActive : !s.isActive);
    return correspondRecherche && correspondEtat;
  });
  const totalPages = Math.max(1, Math.ceil(resultat.length / PAGE_SIZE_ADMIN));
  const pageCourante = Math.min(page, totalPages);
  const resultatPage = resultat.slice((pageCourante - 1) * PAGE_SIZE_ADMIN, pageCourante * PAGE_SIZE_ADMIN);
  const actifs = services.filter((s) => s.isActive).length;
  const nouveauxCetteSemaine = services.filter((s) => depuisMoinsDuneSemaine(s.createdAt)).length;

  function changerPage(p: number) {
    setPage(Math.min(Math.max(p, 1), totalPages));
  }

  function exporter(format: ExportFormat = "csv") {
    exporterTableau(format,
      `${t("csv.filenamePrefix")}-${new Date().toISOString().slice(0, 10)}.csv`,
      t.raw("csv.headers") as string[],
      resultat.map((s) => [s.name, s.delai ?? "", s.cost ?? "", s.isActive ? tCommon("active") : tCommon("inactive")]),
    );
  }

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
    if (!(await confirm(t("confirmDelete", { name: s.name })))) return;
    try {
      await apiFetch(`/services/${s.id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
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
        toast.success(t("updated"));
      } else {
        await apiFetch("/services", { method: "POST", body });
        toast.success(t("created"));
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
            <Layers className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => exporter("csv")} className="gap-1.5"><Download className="size-4" aria-hidden /> CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => exporter("pdf")} className="gap-1.5"><FileText className="size-4" aria-hidden /> PDF</Button>
          <Button size="sm" onClick={ouvrirCreation}>
            {showForm && !editing ? tCommon("cancel") : t("newService")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTrendCard icon={Layers} tone="primary" value={services.length} label={t("stats.total")} delta={nouveauxCetteSemaine} />
        <StatTrendCard icon={CheckCircle2} tone="success" value={actifs} label={t("stats.active")} />
        <StatTrendCard icon={X} tone="destructive" value={services.length - actifs} label={t("stats.inactive")} />
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? t("editingTitle", { name: editing.name }) : t("newServiceTitle")}</p>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="svc-name">{t("fields.name")}</Label>
            <Input id="svc-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="svc-description">{t("fields.description")}</Label>
            <Textarea id="svc-description" name="descriptionFr" rows={3} defaultValue={editing?.description ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-delai">{t("fields.delay")}</Label>
            <Input id="svc-delai" name="delaiFr" placeholder={t("fields.delayPlaceholder")} defaultValue={editing?.delai ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-cost">{t("fields.cost")}</Label>
            <Input id="svc-cost" name="cost" type="number" placeholder={t("fields.costOptional")} defaultValue={editing?.cost ?? ""} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="svc-documents">{t("fields.requiredDocuments")}</Label>
            <Input
              id="svc-documents"
              name="requiredDocuments"
              placeholder={t("fields.requiredDocumentsPlaceholder")}
              defaultValue={(editing?.requiredDocuments ?? []).join(", ")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-image">{t("fields.image", { hint: editing ? t("fields.imageHintKeep") : t("fields.imageHintOptional") })}</Label>
            <Input id="svc-image" name="image" type="file" accept="image/*" />
            {editing?.imageUrl && (
              <img src={editing.imageUrl} alt="" className="mt-1 h-20 w-auto rounded-lg border border-border object-cover" />
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="svc-file">{t("fields.file", { hint: editing ? t("fields.fileHintKeep") : t("fields.fileHintOptional") })}</Label>
            <Input id="svc-file" name="file" type="file" accept=".pdf" />
            {editing?.fileUrl && (
              <a href={editing.fileUrl} data-document-preview target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                {t("viewCurrentFile")}
              </a>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t("fields.activeLabel")}
          </label>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? tCommon("saving") : editing ? tCommon("save") : t("newServiceTitle")}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                {tCommon("cancel")}
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid gap-3 border-b border-border bg-surface/55 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={recherche}
              onChange={(event) => { setRecherche(event.target.value); setPage(1); }}
              className="h-9 bg-card pl-9 text-xs"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Select value={filtreEtat} onValueChange={(value) => { setFiltreEtat(value as typeof filtreEtat); setPage(1); }}>
            <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStates")}</SelectItem>
              <SelectItem value="actif">{t("stats.active")}</SelectItem>
              <SelectItem value="inactif">{t("stats.inactive")}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" size="sm" variant="ghost" onClick={reinitialiser} className="justify-self-start text-xs lg:justify-self-end">
            {tCommon("reset")}
          </Button>
        </div>

        <TableauAdmin
          compact
          codeColumn={false}
          colonnes={[t("columns.service"), t("columns.delay"), t("columns.state"), tCommon("actions")]}
          lignes={resultatPage.map((s) => [
            s.name,
            s.delai ?? "—",
            s.isActive ? <Puce key={s.id} label={tCommon("active")} tone="success" /> : <Puce key={s.id} label={tCommon("inactive")} tone="warning" />,
            <RowActions key={s.id} onEdit={() => ouvrirEdition(s)} onDelete={() => supprimer(s)} />,
          ])}
        />
        {resultatPage.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted-foreground">{t("noResults")}</p>}

        <PaginationAdmin page={pageCourante} totalItems={resultat.length} pageSize={PAGE_SIZE_ADMIN} onPageChange={changerPage} />
      </div>
    </section>
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

function initiales(nom: string) {
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((partie) => partie[0])
    .join("")
    .toUpperCase() || "?";
}

function MessageRow({ message, onUpdated }: { message: ContactMessageAdmin; onUpdated: () => void }) {
  const t = useTranslations("admin.messages");
  const tCommon = useTranslations("admin.common");
  const confirm = useConfirm();
  const [showReply, setShowReply] = useState(false);
  const [reponse, setReponse] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      toast.success(t("replySent"));
      setShowReply(false);
      setReponse("");
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tCommon("error"));
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
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setToggling(false);
    }
  }

  async function supprimer() {
    if (!(await confirm(t("confirmDelete")))) return;
    setDeleting(true);
    try {
      await apiFetch(`/contact-messages/${message.id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article
      className={cn(
        "group relative border-b border-border px-4 py-5 transition-colors last:border-b-0 sm:px-6",
        !message.isRead && !message.isArchived ? "bg-primary/[0.035]" : "hover:bg-muted/50",
      )}
    >
      {!message.isRead && !message.isArchived && (
        <span className="absolute left-0 top-6 h-9 w-1 rounded-r-full bg-primary" aria-label={t("unreadLabel")} />
      )}
      <div className="flex gap-3.5">
        <div className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold shadow-sm",
          !message.isRead && !message.isArchived ? "bg-institution text-primary-foreground" : "bg-accent text-primary",
        )}>
          {initiales(message.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className={cn("text-sm", !message.isRead && !message.isArchived ? "font-bold" : "font-semibold")}>{message.name}</h3>
                <span className="max-w-full truncate text-xs text-muted-foreground">{message.email}</span>
              </div>
              <p className={cn("mt-1 truncate text-sm", !message.isRead && !message.isArchived ? "font-semibold text-foreground" : "font-medium")}>{message.subject}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <time className="text-xs text-muted-foreground">{formaterDate(message.createdAt)}</time>
              {message.isArchived ? <Puce label={t("archived")} tone="info" /> : !message.isRead ? <Puce label={t("new")} tone="warning" /> : null}
            </div>
          </div>

          <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-muted-foreground">{message.message}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => setShowReply((v) => !v)} className="h-8 gap-1.5 px-3 text-xs">
              <Reply className="size-3.5" aria-hidden /> {showReply ? t("closeReply") : t("reply")}
            </Button>
            <button
              type="button"
              onClick={() => toggle("isRead")}
              disabled={toggling}
              title={message.isRead ? t("markUnread") : t("markRead")}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:opacity-50"
            >
              {message.isRead ? <Mail className="size-4" aria-hidden /> : <MailOpen className="size-4" aria-hidden />}
              <span className="sr-only">{t("markAs", { state: message.isRead ? t("stateUnread") : t("stateRead") })}</span>
            </button>
            <button
              type="button"
              onClick={() => toggle("isArchived")}
              disabled={toggling}
              title={message.isArchived ? t("unarchive") : t("archive")}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:opacity-50"
            >
              <Archive className="size-4" aria-hidden />
              <span className="sr-only">{message.isArchived ? t("unarchive") : t("archive")}</span>
            </button>
            <button
              type="button"
              onClick={supprimer}
              disabled={deleting}
              title={t("delete")}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="sr-only">{t("delete")}</span>
            </button>
          </div>
        </div>
      </div>

      {showReply && (
        <form onSubmit={envoyer} className="ml-0 mt-5 grid gap-3 rounded-xl border border-primary/15 bg-surface p-4 sm:ml-[3.4rem]">
          <Label htmlFor={`message-reply-${message.id}`} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Reply className="size-3.5 text-primary" aria-hidden /> {t("replyTo", { name: message.name })}
          </Label>
          <Textarea
            id={`message-reply-${message.id}`}
            value={reponse}
            onChange={(e) => setReponse(e.target.value)}
            rows={4}
            required
            placeholder={t("replyPlaceholder", { name: message.name })}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={sending} className="justify-self-start gap-1.5">
            <Send className="size-3.5" aria-hidden /> {sending ? t("sending") : t("sendByEmail")}
          </Button>
        </form>
      )}
    </article>
  );
}

function MessagesAdmin() {
  const t = useTranslations("admin.messages");
  const tCommon = useTranslations("admin.common");
  const { data: messages, loading, error, refetch } = useApiList<ContactMessageAdmin>("/contact-messages?pageSize=100");
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"all" | "unread" | "archived">("all");

  const messagesFiltres = messages.filter((message) => {
    const termes = `${message.name} ${message.email} ${message.subject} ${message.message}`.toLocaleLowerCase("fr");
    const correspondRecherche = termes.includes(recherche.trim().toLocaleLowerCase("fr"));
    const correspondFiltre =
      filtre === "archived"
        ? message.isArchived
        : !message.isArchived && (filtre === "all" || !message.isRead);
    return correspondRecherche && correspondFiltre;
  });
  const nonLus = messages.filter((message) => !message.isRead && !message.isArchived).length;

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-col gap-4 border-b border-border bg-surface/70 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-teal-600 text-white shadow transition-colors hover:bg-teal-700"><Inbox className="size-4" aria-hidden /></span>
            <h2 className="font-heading text-base font-semibold">{t("inbox")}</h2>
            {nonLus > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{nonLus}</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("receivedCount", { count: messages.length })}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder={t("searchPlaceholder")} className="h-9 pl-9 text-xs" />
          </div>
          <div className="flex rounded-lg bg-muted p-1" aria-label={t("inbox")}>
            {([['all', t("filterAll")], ['unread', t("filterUnread")], ['archived', t("filterArchived")]] as const).map(([valeur, libelle]) => (
              <button key={valeur} type="button" onClick={() => setFiltre(valeur)} className={cn("rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors", filtre === valeur ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {libelle}
              </button>
            ))}
          </div>
        </div>
      </div>
      {messagesFiltres.map((m) => (
        <MessageRow key={m.id} message={m} onUpdated={refetch} />
      ))}
      {messagesFiltres.length === 0 && (
        <div className="px-5 py-14 text-center">
          <Inbox className="mx-auto size-8 text-muted-foreground/50" aria-hidden />
          <p className="mt-3 text-sm font-medium">{messages.length === 0 ? t("emptyInbox") : t("noSearchResults")}</p>
          {messages.length > 0 && <button type="button" onClick={() => { setRecherche(""); setFiltre("all"); }} className="mt-2 text-xs font-semibold text-primary hover:underline">{t("resetFilters")}</button>}
        </div>
      )}
    </section>
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
  const t = useTranslations("admin.regulation");
  const tCommon = useTranslations("admin.common");
  const confirm = useConfirm();
  const { data: textes, loading, error, refetch } = useApiList<ReglementationAdmin>("/regulations?lang=fr&pageSize=100");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ReglementationAdmin | null>(null);
  const [description, setDescription] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("all");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [page, setPage] = useState(1);

  const categoriesNoms = Array.from(new Set(textes.map((texte) => texte.category)));

  function reinitialiser() {
    setRecherche("");
    setFiltreCategorie("all");
    setDateDebut("");
    setDateFin("");
    setPage(1);
  }

  const resultat = textes.filter((texte) => {
    const correspondRecherche = texte.name.toLocaleLowerCase("fr").includes(recherche.trim().toLocaleLowerCase("fr"));
    const correspondCategorie = filtreCategorie === "all" || texte.category === filtreCategorie;
    const date = texte.dateUpload.slice(0, 10);
    const correspondDateDebut = !dateDebut || date >= dateDebut;
    const correspondDateFin = !dateFin || date <= dateFin;
    return correspondRecherche && correspondCategorie && correspondDateDebut && correspondDateFin;
  });
  const totalPages = Math.max(1, Math.ceil(resultat.length / PAGE_SIZE_ADMIN));
  const pageCourante = Math.min(page, totalPages);
  const resultatPage = resultat.slice((pageCourante - 1) * PAGE_SIZE_ADMIN, pageCourante * PAGE_SIZE_ADMIN);
  const totalVues = textes.reduce((somme, texte) => somme + texte.views, 0);
  const misEnAvant = textes.filter((texte) => texte.isPopular).length;
  const nouveauxCetteSemaine = textes.filter((texte) => depuisMoinsDuneSemaine(texte.dateUpload)).length;

  function changerPage(p: number) {
    setPage(Math.min(Math.max(p, 1), totalPages));
  }

  function exporter(format: ExportFormat = "csv") {
    exporterTableau(format,
      `${t("csv.filenamePrefix")}-${new Date().toISOString().slice(0, 10)}.csv`,
      t.raw("csv.headers") as string[],
      resultat.map((texte) => [texte.name, texte.category, texte.format, texte.views, formaterDate(texte.dateUpload)]),
    );
  }

  function ouvrirCreation() {
    setEditing(null);
    setDescription("");
    setIsPopular(false);
    setShowForm((v) => !v);
  }

  function ouvrirEdition(texte: ReglementationAdmin) {
    setEditing(texte);
    setDescription(texte.description ?? "");
    setIsPopular(texte.isPopular);
    setShowForm(true);
  }

  async function supprimer(texte: ReglementationAdmin) {
    if (!(await confirm(t("confirmDelete", { name: texte.name })))) return;
    try {
      await apiFetch(`/regulations/${texte.id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  }

  async function soumettre(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = new FormData(event.currentTarget);
    const fichier = form.get("file") as File;
    if (!editing && (!fichier || fichier.size === 0)) {
      setFormError(t("fileRequired"));
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
        toast.success(t("updated"));
      } else {
        await apiFetch("/regulations", { method: "POST", body });
        toast.success(t("created"));
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
            <ScrollText className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => exporter("csv")} className="gap-1.5"><Download className="size-4" aria-hidden /> CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => exporter("pdf")} className="gap-1.5"><FileText className="size-4" aria-hidden /> PDF</Button>
          <Button size="sm" onClick={ouvrirCreation}>
            {showForm && !editing ? tCommon("cancel") : t("newText")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTrendCard icon={ScrollText} tone="primary" value={textes.length} label={t("stats.total")} delta={nouveauxCetteSemaine} />
        <StatTrendCard icon={Eye} tone="warning" value={totalVues} label={t("stats.totalViews")} />
        <StatTrendCard icon={CheckCircle2} tone="success" value={misEnAvant} label={t("stats.featured")} />
        <StatTrendCard icon={FileText} tone="primary" value={categoriesNoms.length} label={t("stats.categories")} />
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? t("editingTitle", { name: editing.name }) : t("newTextTitle")}</p>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="reg-name">{t("fields.name")}</Label>
            <Input id="reg-name" name="nameFr" required defaultValue={editing?.name} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="reg-description">{t("fields.description")}</Label>
            <Textarea
              id="reg-description"
              rows={3}
              placeholder={t("fields.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="rounded-lg border border-dashed border-border bg-surface p-3">
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{t("fields.sitePreview")}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {description || <span className="italic text-muted-foreground/60">{t("fields.noDescriptionYet")}</span>}
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reg-category">{t("fields.category")}</Label>
            <Input id="reg-category" name="category" required placeholder={t("fields.categoryPlaceholder")} defaultValue={editing?.category} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reg-date">{t("fields.publicationDate")}</Label>
            <Input id="reg-date" name="dateUpload" type="date" required defaultValue={editing?.dateUpload?.slice(0, 10)} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} />
            {t("fields.featureLabel")}
          </label>
          {editing?.fileUrl && (
            <a href={editing.fileUrl} data-document-preview target="_blank" rel="noreferrer" className="text-sm text-primary underline sm:col-span-2">
              {t("viewCurrentFile")}
            </a>
          )}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="reg-file">{t("fields.file", { hint: editing ? t("fields.fileHintKeep") : "*" })}</Label>
            <Input id="reg-file" name="file" type="file" accept=".pdf" required={!editing} />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? tCommon("saving") : editing ? tCommon("save") : t("newTextTitle")}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                {tCommon("cancel")}
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid gap-3 border-b border-border bg-surface/55 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_9rem_9rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={recherche}
              onChange={(event) => { setRecherche(event.target.value); setPage(1); }}
              className="h-9 bg-card pl-9 text-xs"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Select value={filtreCategorie} onValueChange={(value) => { setFiltreCategorie(value); setPage(1); }}>
            <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon("allCategories")}</SelectItem>
              {categoriesNoms.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateDebut} onChange={(event) => { setDateDebut(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("startDate")} />
          <Input type="date" value={dateFin} onChange={(event) => { setDateFin(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("endDate")} />
          <Button type="button" size="sm" variant="ghost" onClick={reinitialiser} className="justify-self-start text-xs lg:justify-self-end">
            {tCommon("reset")}
          </Button>
        </div>

        <TableauAdmin
          compact
          codeColumn={false}
          colonnes={[t("columns.text"), t("columns.category"), t("columns.format"), t("columns.publishedOn"), t("columns.views"), tCommon("actions")]}
          lignes={resultatPage.map((texte) => [
            texte.name,
            texte.category,
            texte.format,
            formaterDate(texte.dateUpload),
            texte.views.toLocaleString("fr-FR"),
            <RowActions key={texte.id} onEdit={() => ouvrirEdition(texte)} onDelete={() => supprimer(texte)} />,
          ])}
        />
        {resultatPage.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted-foreground">{t("noResults")}</p>}

        <PaginationAdmin page={pageCourante} totalItems={resultat.length} pageSize={PAGE_SIZE_ADMIN} onPageChange={changerPage} />
      </div>
    </section>
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
  createdAt: string;
}

function ConsultationsAdmin() {
  const t = useTranslations("admin.consultations");
  const tCommon = useTranslations("admin.common");
  const tStatus = useTranslations("status");
  const confirm = useConfirm();
  const { data: consultations, loading, error, refetch } = useApiList<ConsultationAdmin>(
    "/public-consultations?lang=fr&pageSize=100",
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ConsultationAdmin | null>(null);
  const [status, setStatus] = useState<string>("OUVERTE");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"all" | ConsultationAdmin["status"]>("all");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [page, setPage] = useState(1);

  function reinitialiser() {
    setRecherche("");
    setFiltreStatut("all");
    setDateDebut("");
    setDateFin("");
    setPage(1);
  }

  const resultat = consultations.filter((c) => {
    const correspondRecherche = c.title.toLocaleLowerCase("fr").includes(recherche.trim().toLocaleLowerCase("fr"));
    const correspondStatut = filtreStatut === "all" || c.status === filtreStatut;
    const date = c.startDate.slice(0, 10);
    const correspondDateDebut = !dateDebut || date >= dateDebut;
    const correspondDateFin = !dateFin || date <= dateFin;
    return correspondRecherche && correspondStatut && correspondDateDebut && correspondDateFin;
  });
  const totalPages = Math.max(1, Math.ceil(resultat.length / PAGE_SIZE_ADMIN));
  const pageCourante = Math.min(page, totalPages);
  const resultatPage = resultat.slice((pageCourante - 1) * PAGE_SIZE_ADMIN, pageCourante * PAGE_SIZE_ADMIN);
  const ouvertes = consultations.filter((c) => c.status === "OUVERTE").length;
  const cloturees = consultations.filter((c) => c.status === "CLOTUREE").length;
  const nouvellesCetteSemaine = consultations.filter((c) => depuisMoinsDuneSemaine(c.createdAt)).length;

  function changerPage(p: number) {
    setPage(Math.min(Math.max(p, 1), totalPages));
  }

  function exporter(format: ExportFormat = "csv") {
    exporterTableau(format,
      `${t("csv.filenamePrefix")}-${new Date().toISOString().slice(0, 10)}.csv`,
      t.raw("csv.headers") as string[],
      resultat.map((c) => [c.title, tStatus(c.status), formaterDate(c.startDate), formaterDate(c.endDate)]),
    );
  }

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
    if (!(await confirm(t("confirmDelete", { name: c.title })))) return;
    try {
      await apiFetch(`/public-consultations/${c.id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
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
        toast.success(t("updated"));
      } else {
        await apiFetch("/public-consultations", { method: "POST", body });
        toast.success(t("created"));
      }
      setShowForm(false);
      setEditing(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
            <Vote className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => exporter("csv")} className="gap-1.5"><Download className="size-4" aria-hidden /> CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => exporter("pdf")} className="gap-1.5"><FileText className="size-4" aria-hidden /> PDF</Button>
          <Button size="sm" onClick={ouvrirCreation}>
            {showForm && !editing ? tCommon("cancel") : t("newConsultation")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTrendCard icon={Vote} tone="primary" value={consultations.length} label={t("stats.total")} delta={nouvellesCetteSemaine} />
        <StatTrendCard icon={CheckCircle2} tone="success" value={ouvertes} label={t("stats.open")} />
        <StatTrendCard icon={X} tone="destructive" value={cloturees} label={t("stats.closed")} />
      </div>

      {showForm && (
        <form key={editing?.id ?? "new"} onSubmit={soumettre} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-sm font-semibold sm:col-span-2">{editing ? t("editingTitle", { name: editing.title }) : t("newConsultationTitle")}</p>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cons-title">{t("fields.title")}</Label>
            <Input id="cons-title" name="titleFr" required defaultValue={editing?.title} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cons-description">{t("fields.description")}</Label>
            <Textarea id="cons-description" name="descriptionFr" required rows={3} defaultValue={editing?.description} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cons-status">{t("fields.status")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="cons-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSULTATION_STATUTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {tStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cons-start">{t("fields.startDate")}</Label>
            <Input id="cons-start" name="startDate" type="date" required defaultValue={editing?.startDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cons-end">{t("fields.endDate")}</Label>
            <Input id="cons-end" name="endDate" type="date" required defaultValue={editing?.endDate?.slice(0, 10)} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cons-email">{t("fields.contactEmail")}</Label>
            <Input id="cons-email" name="contactEmail" type="email" required defaultValue={editing?.contactEmail} />
          </div>
          {editing?.fileUrl && (
            <a href={editing.fileUrl} data-document-preview target="_blank" rel="noreferrer" className="text-sm text-primary underline sm:col-span-2">
              {t("viewCurrentDocument")}
            </a>
          )}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="cons-file">{t("fields.file", { hint: editing ? t("fields.fileHintKeep") : t("fields.fileHintOptional") })}</Label>
            <Input id="cons-file" name="file" type="file" accept=".pdf" />
          </div>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={submitting} className="justify-self-start">
              {submitting ? tCommon("saving") : editing ? tCommon("save") : t("newConsultationTitle")}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                {tCommon("cancel")}
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid gap-3 border-b border-border bg-surface/55 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_9rem_9rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={recherche}
              onChange={(event) => { setRecherche(event.target.value); setPage(1); }}
              className="h-9 bg-card pl-9 text-xs"
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Select value={filtreStatut} onValueChange={(value) => { setFiltreStatut(value as typeof filtreStatut); setPage(1); }}>
            <SelectTrigger className="h-9 bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon("allStatuses")}</SelectItem>
              {CONSULTATION_STATUTS.map((s) => <SelectItem key={s} value={s}>{tStatus(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateDebut} onChange={(event) => { setDateDebut(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("startDate")} />
          <Input type="date" value={dateFin} onChange={(event) => { setDateFin(event.target.value); setPage(1); }} className="h-9 bg-card text-xs" aria-label={tCommon("endDate")} />
          <Button type="button" size="sm" variant="ghost" onClick={reinitialiser} className="justify-self-start text-xs lg:justify-self-end">
            {tCommon("reset")}
          </Button>
        </div>

        <TableauAdmin
          compact
          codeColumn={false}
          colonnes={[t("columns.consultation"), t("columns.period"), tCommon("status"), tCommon("actions")]}
          lignes={resultatPage.map((c) => [
            c.title,
            `${formaterDate(c.startDate)} → ${formaterDate(c.endDate)}`,
            <StatutBadge key={c.uid} statut={c.status} />,
            <RowActions key={c.id} onEdit={() => ouvrirEdition(c)} onDelete={() => supprimer(c)} />,
          ])}
        />
        {resultatPage.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted-foreground">{t("noResults")}</p>}

        <PaginationAdmin page={pageCourante} totalItems={resultat.length} pageSize={PAGE_SIZE_ADMIN} onPageChange={changerPage} />
      </div>
    </section>
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
  emailVerified: boolean;
  dateJoined: string;
  accountType: "PARTICULIER" | "ENTREPRISE";
  companyName: string | null;
  hasCompanyDocument: boolean;
  enterpriseApprovalStatus: "EN_ATTENTE" | "APPROUVE" | "REJETE" | null;
  rejectionReason: string | null;
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
  const t = useTranslations("admin.users.roleSelect");
  const tCommon = useTranslations("admin.common");
  const [pending, setPending] = useState(false);

  async function changer(value: string) {
    setPending(true);
    try {
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ roleId: value === "none" ? null : Number(value) }),
      });
      toast.success(t("roleUpdated"));
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={user.role ? String(user.role.id) : "none"} onValueChange={changer} disabled={pending}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("noRole")}</SelectItem>
          {roles.map((r) => (
            <SelectItem key={r.id} value={String(r.id)}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Purement informatif : isSuperuser garde tous les droits quel que soit
          le rôle choisi ci-dessus (voir PermissionsGuard côté backend), mais
          reste modifiable ici pour que l'affichage/l'organisation des comptes
          reste cohérent (ex: filtrage par rôle) même pour un superuser. */}
      {user.isSuperuser && <span className="text-[10px] whitespace-nowrap text-muted-foreground">{t("superAdmin")}</span>}
    </div>
  );
}

function UserActiveToggle({ user, onUpdated }: { user: UserAdmin; onUpdated: () => void }) {
  const t = useTranslations("admin.users.activeToggle");
  const tCommon = useTranslations("admin.common");
  const [pending, setPending] = useState(false);

  async function toggler() {
    setPending(true);
    try {
      await apiFetch(`/users/${user.id}/toggle-active`, { method: "POST" });
      toast.success(user.isActive ? t("deactivated") : t("activated"));
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
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
        <Puce label={tCommon("active")} tone="success" />
      ) : (
        <Puce label={tCommon("inactive")} tone="warning" />
      )}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-b border-border py-2 last:border-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{value}</dd>
    </div>
  );
}

/** Lien "Voir" par ligne (Utilisateurs comme Comptes entreprise) — ouvre le détail complet du compte, pas résumable dans une seule cellule de tableau. */
function VoirCompteButton({ user }: { user: UserAdmin }) {
  const t = useTranslations("admin.users.detail");
  const tRole = useTranslations("admin.users.roleSelect");
  const tEnterpriseStatus = useTranslations("admin.users.enterpriseStatus");
  const tCommon = useTranslations("admin.common");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const na = t("notAvailable");

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-xs font-medium text-primary hover:underline"
      >
        {tCommon("view")}
      </button>
      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border border-border bg-card p-0 text-card-foreground shadow-soft backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-heading text-base font-semibold">{t("title")}</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={tCommon("close")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <dl className="px-5 py-2">
          <DetailRow label={t("name")} value={user.fullname} />
          <DetailRow label={t("email")} value={user.email} />
          <DetailRow label={t("emailVerified")} value={user.emailVerified ? t("yes") : t("no")} />
          <DetailRow label={t("accountType")} value={user.accountType === "ENTREPRISE" ? t("enterprise") : t("individual")} />
          {user.accountType === "ENTREPRISE" && (
            <>
              <DetailRow label={t("companyName")} value={user.companyName ?? na} />
              <DetailRow
                label={t("enterpriseStatus")}
                value={user.enterpriseApprovalStatus ? tEnterpriseStatus(user.enterpriseApprovalStatus) : na}
              />
              {user.rejectionReason && <DetailRow label={t("rejectionReason")} value={user.rejectionReason} />}
              <DetailRow
                label={t("document")}
                value={user.hasCompanyDocument ? <EntrepriseDocumentLink userId={user.id} /> : na}
              />
            </>
          )}
          <DetailRow label={t("role")} value={user.isSuperuser ? tRole("superAdmin") : (user.role?.name ?? tRole("noRole"))} />
          <DetailRow label={t("state")} value={user.isActive ? tCommon("active") : tCommon("inactive")} />
          <DetailRow label={t("joinedOn")} value={formaterDate(user.dateJoined)} />
        </dl>
        <div className="flex justify-end border-t border-border px-5 py-4">
          <Button type="button" size="sm" variant="outline" onClick={() => dialogRef.current?.close()}>
            {tCommon("close")}
          </Button>
        </div>
      </dialog>
    </>
  );
}

function RolesAdmin() {
  const t = useTranslations("admin.roles");
  const tCommon = useTranslations("admin.common");
  const confirm = useConfirm();
  const { data: roles, loading, error, refetch } = useApiOne<RoleAdmin[]>("/roles");
  const { data: permissions } = useApiOne<PermissionOption[]>("/permissions");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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

  function ouvrirCreation() {
    setEditingId(null);
    setNom("");
    setSelectedPerms(new Set());
    setFormError("");
    setShowForm(true);
  }

  function ouvrirEdition(r: RoleAdmin) {
    setEditingId(r.id);
    setNom(r.name);
    setSelectedPerms(new Set(r.permissions.map((p) => p.id)));
    setFormError("");
    setShowForm(true);
  }

  function fermerForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function enregistrer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (nom.trim().length < 2) {
      setFormError(t("nameTooShort"));
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(editingId ? `/roles/${editingId}` : "/roles", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({ name: nom, permissionIds: Array.from(selectedPerms) }),
      });
      toast.success(editingId ? t("roleUpdated") : t("roleCreated"));
      fermerForm();
      setNom("");
      setSelectedPerms(new Set());
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function supprimer(id: number) {
    if (!(await confirm(t("confirmDelete")))) return;
    try {
      await apiFetch(`/roles/${id}`, { method: "DELETE" });
      toast.success(t("roleDeleted"));
      if (editingId === id) fermerForm();
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    }
  }

  if (loading) return <p className="mt-6 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-6 text-sm text-destructive">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
        <Button size="sm" onClick={() => (showForm ? fermerForm() : ouvrirCreation())}>
          {showForm ? tCommon("cancel") : t("newRole")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={enregistrer} className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-5">
          <div className="grid gap-2 max-w-sm">
            <Label htmlFor="role-name">{t("nameLabel")}</Label>
            <Input id="role-name" value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div>
            <Label>{t("permissionsLabel")}</Label>
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
            {submitting ? tCommon("saving") : editingId ? t("submitEdit") : t("submitCreate")}
          </Button>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(roles ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{r.name}</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => ouvrirEdition(r)} className="text-xs font-medium text-primary hover:underline">
                  {tCommon("edit")}
                </button>
                <button onClick={() => supprimer(r.id)} className="text-xs text-destructive hover:underline">
                  {tCommon("delete")}
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("permissionCount", { count: r.permissions.length })}</p>
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
          <p className="text-sm text-muted-foreground">{t("noRolesYet")}</p>
        )}
      </div>
    </div>
  );
}

function EntrepriseDocumentLink({ userId }: { userId: number }) {
  const t = useTranslations("admin.users.document");
  const preview = useDocumentPreview();
  const [pending, setPending] = useState(false);

  async function voir() {
    setPending(true);
    try {
      const res = await apiFetch<{ url: string }>(`/users/${userId}/company-document`);
      preview({ url: res.url, title: t("viewDocument") });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("openError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={voir} disabled={pending} className="text-xs font-medium text-primary hover:underline disabled:opacity-50">
      {t("viewDocument")}
    </button>
  );
}

function EnterpriseApprovalActions({ user, onUpdated }: { user: UserAdmin; onUpdated: () => void }) {
  const t = useTranslations("admin.users.approval");
  const tCommon = useTranslations("admin.common");
  const [pending, setPending] = useState(false);

  async function decide(decision: "APPROUVE" | "REJETE") {
    const reason = decision === "REJETE" ? window.prompt(t("rejectPrompt")) : undefined;
    if (decision === "REJETE" && !reason?.trim()) return;
    setPending(true);
    try {
      await apiFetch(`/users/${user.id}/enterprise-approval`, {
        method: "PATCH",
        body: JSON.stringify({ decision, ...(reason ? { reason: reason.trim() } : {}) }),
      });
      toast.success(decision === "APPROUVE" ? t("approved") : t("rejected"));
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tCommon("error"));
    } finally {
      setPending(false);
    }
  }

  if (user.enterpriseApprovalStatus !== "EN_ATTENTE") return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <Button type="button" size="sm" disabled={pending} onClick={() => decide("APPROUVE")} className="h-7 px-2 text-[11px]">{t("approve")}</Button>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => decide("REJETE")} className="h-7 px-2 text-[11px]">{t("reject")}</Button>
    </div>
  );
}

function CreerUtilisateurAdmin({ roles, onCreated }: { roles: RoleOption[]; onCreated: () => void }) {
  const t = useTranslations("admin.users.create");
  const tCommon = useTranslations("admin.common");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const membre = roles.find((r) => r.name === "Membre");
  const [roleIdOverride, setRoleIdOverride] = useState<string | null>(null);
  // "Membre" par défaut tant que l'admin n'a pas choisi un autre rôle —
  // calculé plutôt que synchronisé via effet, roles arrivant après le
  // premier rendu (useApiOne).
  const roleId = roleIdOverride ?? (membre ? String(membre.id) : "");

  async function creer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          fullname: String(data.get("fullname")),
          email: String(data.get("email")),
          roleId: roleId ? Number(roleId) : undefined,
        }),
      });
      toast.success(t("created"));
      setShowForm(false);
      setRoleIdOverride(null);
      event.currentTarget.reset();
      onCreated();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => setShowForm((v) => !v)}>
          {showForm ? tCommon("cancel") : t("addAccount")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={creer} className="mt-5 grid gap-4 rounded-xl border border-primary/15 bg-surface p-5 shadow-soft sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="new-user-fullname">{t("fullname")}</Label>
            <Input id="new-user-fullname" name="fullname" required minLength={2} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-user-email">{t("email")}</Label>
            <Input id="new-user-email" name="email" type="email" required />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="new-user-role">{t("role")}</Label>
            <Select value={roleId} onValueChange={setRoleIdOverride}>
              <SelectTrigger id="new-user-role">
                <SelectValue placeholder={t("roleDefaultPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {t("noPasswordHint")}
          </p>
          {formError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{formError}</p>}
          <Button type="submit" disabled={submitting} className="justify-self-start">
            {submitting ? t("creating") : t("submit")}
          </Button>
        </form>
      )}
    </div>
  );
}

function UtilisateursAdmin() {
  const t = useTranslations("admin.users.list");
  const tDetail = useTranslations("admin.users.detail");
  const tCommon = useTranslations("admin.common");
  const { data: users, loading, error, refetch } = useApiList<UserAdmin>("/users?pageSize=100");
  const { data: roles } = useApiOne<RoleOption[]>("/roles");
  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState<"all" | UserAdmin["accountType"]>("all");
  const [filtreEtat, setFiltreEtat] = useState<"all" | "active" | "inactive">("all");

  const comptesFiltres = users.filter((user) => {
    const texte = `${user.fullname} ${user.email} ${user.companyName ?? ""} ${user.role?.name ?? ""}`.toLocaleLowerCase("fr");
    return (
      texte.includes(recherche.trim().toLocaleLowerCase("fr")) &&
      (filtreType === "all" || user.accountType === filtreType) &&
      (filtreEtat === "all" || (filtreEtat === "active" ? user.isActive : !user.isActive))
    );
  });
  const comptesEntreprise = users.filter((user) => user.accountType === "ENTREPRISE").length;
  const comptesActifs = users.filter((user) => user.isActive).length;
  const enAttente = users.filter((user) => user.enterpriseApprovalStatus === "EN_ATTENTE").length;

  if (loading) return <p className="mt-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="mt-8 text-sm text-destructive">{error}</p>;

  return (
    <div className="mt-8 grid gap-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="bg-institution px-5 py-6 text-primary-foreground sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700"><Users className="size-5" aria-hidden /></span>
              <div>
                <p className="font-heading text-xs font-semibold tracking-[0.16em] uppercase opacity-80">{t("eyebrow")}</p>
                <h1 className="mt-1 font-heading text-2xl font-semibold">{t("title")}</h1>
                <p className="mt-1 text-sm leading-6 text-primary-foreground/75">{t("subtitle")}</p>
              </div>
            </div>
            {enAttente > 0 && <span className="rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold">{t("pendingEnterprises", { count: enAttente })}</span>}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-primary-foreground/15 sm:grid-cols-4">
            {[
              [users.length, t("statTotal")],
              [comptesActifs, t("statActive")],
              [comptesEntreprise, t("statEnterprise")],
              [roles?.length ?? 0, t("statRoles")],
            ].map(([valeur, libelle]) => (
              <div key={String(libelle)} className="bg-primary-deep/25 px-4 py-3">
                <p className="font-heading text-xl font-bold tabular-nums">{valeur}</p>
                <p className="mt-0.5 text-[11px] text-primary-foreground/70">{libelle}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <CreerUtilisateurAdmin roles={roles ?? []} onCreated={refetch} />
          <div className="mt-6 flex flex-col gap-3 border-y border-border py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={recherche} onChange={(event) => setRecherche(event.target.value)} className="h-10 pl-9 text-sm" placeholder={t("searchPlaceholder")} />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-lg bg-muted p-1">
                {([['all', t("typeAll")], ['PARTICULIER', t("typeIndividual")], ['ENTREPRISE', t("typeEnterprise")]] as const).map(([valeur, libelle]) => (
                  <button key={valeur} type="button" onClick={() => setFiltreType(valeur)} className={cn("rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors", filtreType === valeur ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{libelle}</button>
                ))}
              </div>
              <div className="flex rounded-lg bg-muted p-1">
                {([['all', t("stateAll")], ['active', t("stateActive")], ['inactive', t("stateInactive")]] as const).map(([valeur, libelle]) => (
                  <button key={valeur} type="button" onClick={() => setFiltreEtat(valeur)} className={cn("rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors", filtreEtat === valeur ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{libelle}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <TableauAdmin
              codeColumn={false}
              colonnes={[t("columns.account"), t("columns.profile"), t("columns.roleAccess"), t("columns.created"), t("columns.status")]}
              lignes={comptesFiltres.map((u) => [
                <div key={u.id} className="flex min-w-55 items-center gap-3">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold", u.isActive ? "bg-accent text-primary" : "bg-muted text-muted-foreground")}>{initiales(u.fullname)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{u.fullname}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <VoirCompteButton user={u} />
                </div>,
                <div key={`profile-${u.id}`} className="min-w-32">
                  <Puce label={u.accountType === "ENTREPRISE" ? tDetail("enterprise") : tDetail("individual")} tone={u.accountType === "ENTREPRISE" ? "info" : "success"} />
                  {u.accountType === "ENTREPRISE" && <p className="mt-1 max-w-36 truncate text-xs text-muted-foreground">{u.companyName ?? "—"}</p>}
                  {u.accountType === "ENTREPRISE" && <EnterpriseApprovalActions user={u} onUpdated={refetch} />}
                </div>,
                <UserRoleSelect key={`role-${u.id}`} user={u} roles={roles ?? []} onUpdated={refetch} />,
                <span key={`date-${u.id}`} className="whitespace-nowrap text-xs text-muted-foreground">{formaterDate(u.dateJoined)}</span>,
                <div key={`status-${u.id}`} className="flex flex-col items-start gap-1.5"><UserActiveToggle user={u} onUpdated={refetch} />{!u.emailVerified && <span className="text-[10px] font-medium text-warning-foreground">{t("emailNotVerified")}</span>}</div>,
              ])}
            />
          </div>
          {comptesFiltres.length === 0 && (
            <div className="py-10 text-center">
              <Users className="mx-auto size-8 text-muted-foreground/50" aria-hidden />
              <p className="mt-3 text-sm font-medium">{t("noResults")}</p>
              <button type="button" onClick={() => { setRecherche(""); setFiltreType("all"); setFiltreEtat("all"); }} className="mt-2 text-xs font-semibold text-primary hover:underline">{tCommon("reset")}</button>
            </div>
          )}
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <RolesAdmin />
      </section>
    </div>
  );
}

function AdminLogin() {
  const t = useTranslations("admin");
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
      setError(err instanceof ApiError ? err.message : t("login.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid h-full place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h1 className="text-xl font-bold">{t("login.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("login.subtitle")}</p>
        <div className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="admin-email">{t("login.email")}</Label>
            <Input id="admin-email" name="email" type="email" required placeholder="vous@arpt.gov.gn" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-password">{t("login.password")}</Label>
            <Input id="admin-password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-1">
            {submitting ? t("login.signingIn") : t("login.signIn")}
          </Button>
          <Link href="/mot-de-passe" className="text-center text-xs font-medium text-primary hover:underline">
            {t("login.firstLogin")}
          </Link>
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
