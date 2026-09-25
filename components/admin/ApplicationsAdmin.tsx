"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Briefcase, Download, FileText, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError, type PaginatedResult } from "@/lib/api";
import { useApiOne } from "@/lib/hooks";
import { formaterDate } from "@/data/mock";
import { useDocumentPreview } from "@/components/site/DocumentPreview";

type Status = "EN_COURS" | "ACCEPTE" | "REFUSE";
type Profile = {
  id: number;
  fullname: string;
  email: string;
  companyName: string | null;
} | null;
type BaseApplication = {
  id: number;
  user: Profile;
  status: Status;
  submittedAt: string;
};
type CareerApplication = BaseApplication & {
  career: { id: number; code: string; name: string };
  disponibility: string;
  motivationLetter: string | null;
  cvFileKeyPresent: boolean;
};
type TenderApplication = BaseApplication & {
  tendersCall: { id: number; code: string; name: string };
  companyName: string;
  email: string;
  experience: unknown;
  proposition: unknown;
};

type Kind = "careers" | "tenders";

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const translated = value as Record<string, unknown>;
    return String(translated.fr ?? translated.en ?? translated.ar ?? "");
  }
  return "";
}

function ApplicationsList({
  kind,
  canManage,
}: {
  kind: Kind;
  canManage: boolean;
}) {
  const t = useTranslations("admin.applications");
  const preview = useDocumentPreview();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement>(null);
  const careerMode = kind === "careers";
  const path = careerMode ? "/candidatures" : "/submissions";
  const { data, loading, error, refetch } = useApiOne<
    PaginatedResult<CareerApplication | TenderApplication>
  >(`${path}?page=${page}&pageSize=20`);
  const rows = data?.results ?? [];
  const filtered = rows.filter((item) => {
    const offer = "career" in item ? item.career : item.tendersCall;
    const haystack =
      `${item.user?.fullname ?? ""} ${item.user?.email ?? ""} ${offer.name} ${offer.code}`.toLocaleLowerCase();
    return (
      haystack.includes(search.toLocaleLowerCase()) &&
      (statusFilter === "ALL" || item.status === statusFilter)
    );
  });
  const selected = rows.find((item) => item.id === selectedId);

  useEffect(() => {
    if (selectedId === null) return;
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !window.document.querySelector("[data-document-preview-dialog]")
      )
        setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      lastTriggerRef.current?.focus();
    };
  }, [selectedId]);

  async function updateStatus(
    item: CareerApplication | TenderApplication,
    status: Status,
  ) {
    if (item.status === status) return;
    setUpdatingId(item.id);
    try {
      await apiFetch(`${path}/${item.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(t("statusSaved"));
      refetch();
    } catch (cause) {
      toast.error(
        cause instanceof ApiError ? cause.message : t("genericError"),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function openCv(id: number) {
    try {
      const result = await apiFetch<{ url: string }>(
        `/candidatures/${id}/cv-download`,
      );
      preview({ url: result.url, title: t("openCv") });
    } catch (cause) {
      toast.error(
        cause instanceof ApiError ? cause.message : t("genericError"),
      );
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            {careerMode ? (
              <Briefcase className="size-5" aria-hidden />
            ) : (
              <FileText className="size-5" aria-hidden />
            )}
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold">
              {careerMode ? t("careersTitle") : t("tendersTitle")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">
          {t("total", { count: data?.count ?? 0 })}
        </span>
      </header>
      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative min-w-56 flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as Status | "ALL")
          }
          aria-label={t("filterStatus")}
        >
          <option value="ALL">{t("allStatuses")}</option>
          <option value="EN_COURS">{t("inProgress")}</option>
          <option value="ACCEPTE">{t("accepted")}</option>
          <option value="REFUSE">{t("rejected")}</option>
        </select>
      </div>
      {loading && (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("applicant")}</th>
                <th className="px-4 py-3">{t("offer")}</th>
                <th className="px-4 py-3">{t("submittedAt")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => {
                const offer = "career" in item ? item.career : item.tendersCall;
                return (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4">
                      <span className="font-semibold">
                        {item.user?.companyName ||
                          item.user?.fullname ||
                          ("companyName" in item
                            ? item.companyName
                            : t("legacyAnonymous"))}
                      </span>
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {item.user?.email ||
                          ("email" in item ? item.email : "—")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium">{offer.name}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {offer.code}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {formaterDate(item.submittedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={item.status}
                        disabled={!canManage || updatingId === item.id}
                        onChange={(event) =>
                          updateStatus(item, event.target.value as Status)
                        }
                        aria-label={t("status")}
                      >
                        <option value="EN_COURS">{t("inProgress")}</option>
                        <option value="ACCEPTE">{t("accepted")}</option>
                        <option value="REFUSE">{t("rejected")}</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          lastTriggerRef.current = event.currentTarget;
                          setSelectedId(item.id);
                        }}
                      >
                        {t("viewDetails")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              setPage(page - 1);
              setSelectedId(null);
            }}
          >
            {t("previous")}
          </Button>
          <span>
            {page} / {data?.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= (data?.totalPages ?? 1)}
            onClick={() => {
              setPage(page + 1);
              setSelectedId(null);
            }}
          >
            {t("next")}
          </Button>
        </div>
      )}
      {selected &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-3 sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-details-title"
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {careerMode ? t("careersTitle") : t("tendersTitle")}
                  </p>
                  <h2
                    id="application-details-title"
                    className="mt-1 font-heading text-xl font-bold"
                  >
                    {t("detailsTitle")}
                  </h2>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label={t("close")}
                  className="grid size-9 shrink-0 place-items-center rounded-md hover:bg-muted"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </header>
              <div className="min-h-0 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("offer")}
                  </p>
                  <p className="mt-1 font-semibold">
                    {"career" in selected
                      ? selected.career.name
                      : selected.tendersCall.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {"career" in selected
                      ? selected.career.code
                      : selected.tendersCall.code}{" "}
                    · {formaterDate(selected.submittedAt)}
                  </p>
                </div>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">{t("applicant")}</dt>
                    <dd className="mt-1 font-medium">
                      {selected.user?.companyName ||
                        selected.user?.fullname ||
                        ("companyName" in selected
                          ? selected.companyName
                          : t("legacyAnonymous"))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("email")}</dt>
                    <dd className="mt-1 break-all">
                      {selected.user?.email ||
                        ("email" in selected ? selected.email : "—")}
                    </dd>
                  </div>
                </dl>
                {"career" in selected ? (
                  <div className="space-y-4 text-sm">
                    <p>
                      <span className="text-muted-foreground">
                        {t("availability")}:{" "}
                      </span>
                      {formaterDate(selected.disponibility)}
                    </p>
                    <div>
                      <p className="font-medium">{t("motivation")}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {selected.motivationLetter || "—"}
                      </p>
                    </div>
                    {selected.cvFileKeyPresent && (
                      <Button
                        variant="outline"
                        onClick={() => openCv(selected.id)}
                      >
                        <Download className="size-4" aria-hidden />
                        {t("openCv")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-5 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-medium">{t("experience")}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {textValue(selected.experience)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{t("proposal")}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {textValue(selected.proposition)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                  <label
                    htmlFor="application-status"
                    className="text-sm font-medium"
                  >
                    {t("status")}
                  </label>
                  <select
                    id="application-status"
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={selected.status}
                    disabled={!canManage || updatingId === selected.id}
                    onChange={(event) =>
                      updateStatus(selected, event.target.value as Status)
                    }
                  >
                    <option value="EN_COURS">{t("inProgress")}</option>
                    <option value="ACCEPTE">{t("accepted")}</option>
                    <option value="REFUSE">{t("rejected")}</option>
                  </select>
                </div>
              </div>
              <footer className="flex justify-end border-t border-border px-5 py-4 sm:px-7">
                <Button variant="outline" onClick={() => setSelectedId(null)}>
                  {t("close")}
                </Button>
              </footer>
            </section>
          </div>,
          window.document.body,
        )}
    </section>
  );
}
export function ApplicationsAdmin({
  canViewCareers,
  canViewTenders,
  canManageCareers,
  canManageTenders,
}: {
  canViewCareers: boolean;
  canViewTenders: boolean;
  canManageCareers: boolean;
  canManageTenders: boolean;
}) {
  const t = useTranslations("admin.applications");
  const [kind, setKind] = useState<Kind>(
    canViewCareers ? "careers" : "tenders",
  );
  const activeKind =
    kind === "careers" && !canViewCareers
      ? "tenders"
      : kind === "tenders" && !canViewTenders
        ? "careers"
        : kind;
  return (
    <div>
      <div
        role="tablist"
        aria-label={t("careersTitle")}
        className="mt-6 inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/50 p-1"
      >
        {canViewCareers && (
          <button
            type="button"
            role="tab"
            aria-selected={activeKind === "careers"}
            onClick={() => setKind("careers")}
            className={
              activeKind === "careers"
                ? "rounded-lg bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm"
                : "rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            }
          >
            {t("careerTab")}
          </button>
        )}
        {canViewTenders && (
          <button
            type="button"
            role="tab"
            aria-selected={activeKind === "tenders"}
            onClick={() => setKind("tenders")}
            className={
              activeKind === "tenders"
                ? "rounded-lg bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm"
                : "rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            }
          >
            {t("tenderTab")}
          </button>
        )}
      </div>
      <ApplicationsList
        key={activeKind}
        kind={activeKind}
        canManage={
          activeKind === "careers" ? canManageCareers : canManageTenders
        }
      />
    </div>
  );
}
