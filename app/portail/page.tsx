"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell, Briefcase, FileSignature, MessageSquareWarning, UserRound } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { StatutBadge } from "@/components/site/StatutBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formaterDate } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { useApiList, useApiOne } from "@/lib/hooks";
import { useLocale } from "@/lib/locale-context";

/** Fait le lien entre le type d'événement (voir NotificationsService côté backend) et l'onglet où le traiter. */
const NOTIFICATION_TAB_BY_TYPE: Record<string, string> = {
  "claim.status_changed": "reclamations",
  "candidature.status_changed": "candidatures",
  "submission.status_changed": "soumissions",
};

interface Claim {
  id: number;
  claimType: string;
  concernedOperator: string;
  status: "NOUVEAU" | "EN_COURS" | "RESOLU" | "REJETE";
  createdAt: string;
}

interface Candidature {
  id: number;
  status: "EN_COURS" | "ACCEPTE" | "REFUSE";
  submittedAt: string;
  career: { name: string };
}

interface Submission {
  id: number;
  status: "EN_COURS" | "ACCEPTE" | "REFUSE";
  submittedAt: string;
  tendersCall: { code: string; name: string };
}

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function Portail() {
  const t = useTranslations("portalPage");
  const { locale } = useLocale();
  const { user } = useAuth();
  const { data: reclamations } = useApiOne<Claim[]>(user ? "/claims/me" : null);
  const { data: candidatures } = useApiOne<Candidature[]>(user ? `/candidatures/me?lang=${locale}` : null);
  const { data: soumissions } = useApiOne<Submission[]>(user ? `/submissions/me?lang=${locale}` : null);
  const { data: notifications, refetch: refetchNotifications } = useApiList<Notification>(
    user ? "/notifications?pageSize=50" : null,
  );
  const [onglet, setOnglet] = useState("reclamations");

  async function cliquerNotification(n: Notification) {
    if (!n.isRead) {
      apiFetch(`/notifications/${n.id}/read`, { method: "POST" })
        .then(() => refetchNotifications())
        .catch(() => {});
    }
    const cible = NOTIFICATION_TAB_BY_TYPE[n.type];
    if (cible) setOnglet(cible);
  }

  const mesReclamations = reclamations ?? [];
  const mesCandidatures = candidatures ?? [];
  const mesSoumissions = soumissions ?? [];

  const resume = [
    { libelle: t("summary.claims"), valeur: mesReclamations.length, icon: MessageSquareWarning },
    { libelle: t("summary.candidatures"), valeur: mesCandidatures.length, icon: Briefcase },
    { libelle: t("summary.submissions"), valeur: mesSoumissions.length, icon: FileSignature },
    { libelle: t("summary.notifications"), valeur: notifications.filter((n) => !n.isRead).length, icon: Bell },
  ];

  if (!user) {
    return (
      <div className="container-content section-y text-center text-sm text-muted-foreground">
        {t("loginRequired")}
      </div>
    );
  }

  return (
    <>
      <PageHero
        surtitre={t("surtitre")}
        titre={t("titre")}
        description={t("welcome", { name: user.fullname })}
      >
        <div className="inline-flex items-center gap-3 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm">
          <UserRound className="size-4" aria-hidden /> {user.email}
        </div>
      </PageHero>

      <section className="section-y">
        <div className="container-content">
          <dl className="grid gap-x-8 gap-y-6 border-y border-border py-6 sm:grid-cols-2 lg:grid-cols-4">
            {resume.map((r) => (
              <div key={r.libelle} className="flex items-center gap-4 py-2">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
                  <r.icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">{r.libelle}</dt>
                  <dd className="font-heading text-2xl font-bold">{r.valeur}</dd>
                </div>
              </div>
            ))}
          </dl>

          <Tabs value={onglet} onValueChange={setOnglet} className="mt-10">
            <TabsList className="h-auto max-w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="reclamations">{t("tabs.claims")}</TabsTrigger>
              <TabsTrigger value="candidatures">{t("tabs.candidatures")}</TabsTrigger>
              <TabsTrigger value="soumissions">{t("tabs.submissions")}</TabsTrigger>
              <TabsTrigger value="notifications">{t("tabs.notifications")}</TabsTrigger>
            </TabsList>

            <TabsContent value="reclamations" className="mt-6">
              <Tableau
                colonnes={t.raw("claimsColumns") as string[]}
                lignes={mesReclamations.map((r) => [
                  `REC-${r.id}`,
                  r.claimType,
                  r.concernedOperator,
                  formaterDate(r.createdAt),
                  <StatutBadge key={r.id} statut={r.status} />,
                ])}
                vide={t("claimsEmpty")}
                action={{ to: "/reclamations", label: t("fileClaim") }}
              />
            </TabsContent>

            <TabsContent value="candidatures" className="mt-6">
              <Tableau
                colonnes={t.raw("candidaturesColumns") as string[]}
                lignes={mesCandidatures.map((c) => [
                  `CAND-${c.id}`,
                  c.career.name,
                  formaterDate(c.submittedAt),
                  <StatutBadge key={c.id} statut={c.status} />,
                ])}
                vide={t("candidaturesEmpty")}
                action={{ to: "/carrieres", label: t("viewOffers") }}
              />
            </TabsContent>

            <TabsContent value="soumissions" className="mt-6">
              <Tableau
                colonnes={t.raw("submissionsColumns") as string[]}
                lignes={mesSoumissions.map((s) => [
                  `SUB-${s.id}`,
                  s.tendersCall.name,
                  formaterDate(s.submittedAt),
                  <StatutBadge key={s.id} statut={s.status} />,
                ])}
                vide={t("submissionsEmpty")}
                action={{ to: "/appels-offres", label: t("viewTenders") }}
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <ul className="divide-y divide-border border-y border-border">
                {notifications.map((n) => {
                  const cliquable = Boolean(NOTIFICATION_TAB_BY_TYPE[n.type]);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => cliquerNotification(n)}
                        disabled={!cliquable && n.isRead}
                        className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-muted/60 disabled:cursor-default disabled:hover:bg-transparent"
                      >
                        <span className={n.isRead ? "mt-1.5 size-2 shrink-0 rounded-full bg-border" : "mt-1.5 size-2 shrink-0 rounded-full bg-primary"} />
                        <div className="min-w-0">
                          <p className={n.isRead ? "text-sm text-muted-foreground" : "text-sm font-medium"}>{n.title}</p>
                          {n.body && <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>}
                          <p className="mt-1 text-xs text-muted-foreground">{formaterDate(n.createdAt)}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
                {notifications.length === 0 && (
                  <li className="p-8 text-center text-sm text-muted-foreground">{t("noNotifications")}</li>
                )}
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
  lignes: ReactNode[][];
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
