"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formaterDate } from "@/data/mock";
import { useApiOne } from "@/lib/hooks";
import { useLocale } from "@/lib/locale-context";
import { apiFetch, ApiError } from "@/lib/api";

interface Career {
  id: number;
  uid: string;
  code: string;
  name: string;
  description: string;
  publicationDate: string;
  limitDate: string;
  departement: string;
  location: string | null;
  responsibilities: string[];
  desiredProfils: string[];
  advantages: string[];
  contactName: string;
  contactEmail: string;
}

export default function OffreDetail() {
  const t = useTranslations("careerDetail");
  const { locale } = useLocale();
  const { id } = useParams<{ id: string }>();
  const { data: offre, loading, error } = useApiOne<Career>(id ? `/careers/${id}?lang=${locale}` : null);
  const [envoye, setEnvoye] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState("");

  async function postuler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offre) return;
    setErreurEnvoi("");
    setEnvoiEnCours(true);
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    const lettre = String(form.get("lettre") ?? "").trim();
    if (lettre) body.append("motivationLetter", lettre);
    body.append("disponibility", String(form.get("dispo")));
    const cv = form.get("cv") as File;
    if (cv) body.append("cv", cv);

    try {
      await apiFetch(`/careers/${offre.id}/candidatures`, { method: "POST", body });
      setEnvoye(true);
      toast.success(t("submitSuccess"));
    } catch (err) {
      setErreurEnvoi(err instanceof ApiError ? err.message : t("genericError"));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  if (loading) {
    return <div className="container-content section-y text-center text-sm text-muted-foreground">{t("loading")}</div>;
  }

  if (error || !offre) {
    return (
      <div className="container-content section-y text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted">
          <Search className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-bold">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFoundBody")}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/carrieres">
            <ArrowLeft className="size-4" aria-hidden /> {t("backToOffers")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="section-y">
      <div className="container-content grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
          <Link href="/carrieres" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> {t("allOffers")}
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs font-semibold">
              {offre.code}
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-xs font-medium text-destructive">
              <CalendarDays className="size-3.5" aria-hidden /> {t("deadline", { date: formaterDate(offre.limitDate) })}
            </Badge>
          </div>

          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">{offre.name}</h1>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4" aria-hidden /> {offre.departement}
            </span>
            {offre.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> {offre.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> {t("publishedOn", { date: formaterDate(offre.publicationDate) })}
            </span>
          </div>

          <p className="mt-8 leading-8 text-foreground/90">{offre.description}</p>

          {offre.responsibilities.length > 0 && (
            <Bloc titre={t("responsibilities")} items={offre.responsibilities} />
          )}
          {offre.desiredProfils.length > 0 && <Bloc titre={t("desiredProfile")} items={offre.desiredProfils} />}
          {offre.advantages.length > 0 && <Bloc titre={t("advantages")} items={offre.advantages} />}
        </div>

        <div className="rounded-xl max-w-7xl border border-border bg-card p-6 sm:p-7 lg:sticky lg:top-40">
          <h2 className="font-heading text-lg font-semibold">{t("applyTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("applyBody", { name: offre.contactName, email: offre.contactEmail })}
          </p>

          {envoye ? (
            <div className="mt-6 rounded-lg border border-success/40 bg-success/10 p-5 text-sm">
              <p className="font-semibold text-success">{t("submittedTitle")}</p>
              <p className="mt-1 text-muted-foreground">{t("submittedBody")}</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/portail">{t("openPortal")}</Link>
              </Button>
            </div>
          ) : (
            <form className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={postuler}>
              <div className="grid gap-2">
                <Label htmlFor="dispo">{t("availabilityDate")}</Label>
                <Input id="dispo" name="dispo" type="date" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cv">{t("cv")}</Label>
                <Input id="cv" name="cv" type="file" accept=".pdf" required className="file:text-primary" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="lettre">{t("motivationLetter")}</Label>
                <Textarea id="lettre" name="lettre" maxLength={2000} rows={5} placeholder={t("motivationLetterPlaceholder")} />
              </div>
              {erreurEnvoi && <p className="text-sm text-destructive sm:col-span-2">{erreurEnvoi}</p>}
              <Separator className="sm:col-span-2" />
              <Button type="submit" disabled={envoiEnCours} className="sm:col-span-2">
                {envoiEnCours ? t("submitting") : t("submit")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Bloc({ titre, items }: { titre: string; items: string[] }) {
  return (
    <div className="mt-9">
      <h2 className="font-heading text-lg font-semibold">{titre}</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
