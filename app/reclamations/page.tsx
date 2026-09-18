"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  HelpCircle,
  Info,
  LogIn,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Send,
  ShieldAlert,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { AuthTrigger } from "@/components/site/AuthModal";
import { apiFetch, api, ApiError } from "@/lib/api";
import { useApiOne, useContentBlock } from "@/lib/hooks";

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

interface StepItem {
  texte: string;
}

interface ChoiceItem {
  value: string;
  label: string;
}

interface GuideContent {
  titre: string;
  description: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "Protection des consommateurs",
  titre: "Déposer une réclamation",
  description:
    "L'ARPT reçoit et instruit les litiges opposant les usagers aux opérateurs de télécommunications et aux opérateurs postaux.",
};

const ETAPES_DEFAUT: StepItem[] = [
  { texte: "Contactez d'abord le service client de votre opérateur et conservez la référence du dossier." },
  { texte: "Si aucune réponse satisfaisante n'est apportée sous 30 jours, saisissez l'ARPT via ce formulaire." },
  { texte: "Un agent instruit votre dossier et vous informe de l'avancement depuis votre portail usager." },
];

const OPERATEURS_DEFAUT: ChoiceItem[] = [
  { value: "orange", label: "Orange Guinée" },
  { value: "mtn", label: "MTN Guinée" },
  { value: "cellcom", label: "Cellcom" },
  { value: "poste", label: "Guinée Poste" },
  { value: "autre", label: "Autre opérateur" },
];

const TYPES_DEFAUT: ChoiceItem[] = [
  { value: "qualite", label: "Qualité de service" },
  { value: "facturation", label: "Facturation" },
  { value: "reseau", label: "Réseau / couverture" },
  { value: "autre", label: "Autre" },
];

const GUIDE_DEFAUT: GuideContent = {
  titre: "Droits des consommateurs",
  description: "Guide officiel des droits et recours des usagers des services de télécommunications.",
};

export default function Reclamations() {
  const t = useTranslations("claims");
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { data: hero } = useContentBlock<HeroContent>("claims.hero", HERO_DEFAUT);
  const { data: etapes } = useContentBlock<StepItem[]>("claims.steps", ETAPES_DEFAUT);
  const { data: operateursListe } = useContentBlock<ChoiceItem[]>("claims.operators", OPERATEURS_DEFAUT);
  const { data: typesListe } = useContentBlock<ChoiceItem[]>("claims.types", TYPES_DEFAUT);
  const { data: guide } = useContentBlock<GuideContent>("claims.guide", GUIDE_DEFAUT);
  const { data: rightsDocument } = useApiOne<{ fileUrl: string | null }>("/consumer-rights-document");
  const OPERATEURS: Record<string, string> = Object.fromEntries(operateursListe.map((o) => [o.value, o.label]));
  const TYPES: Record<string, string> = Object.fromEntries(typesListe.map((o) => [o.value, o.label]));
  const [envoye, setEnvoye] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [type, setType] = useState("");
  const [operateur, setOperateur] = useState("");
  const [description, setDescription] = useState("");
  // Filtrage préalable — l'ARPT n'intervient qu'en cas d'échec de la
  // résolution à l'amiable avec l'opérateur. "notYet" ne bloque pas
  // définitivement (aucun moyen de le vérifier côté serveur) mais rappelle
  // la marche à suivre en priorité.
  const [gateStep, setGateStep] = useState<"question" | "notYet" | "form">("question");

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    if (!type || !operateur) {
      setErreur(t("submitError"));
      return;
    }
    setEnvoiEnCours(true);
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    if (form.get("tel")) body.append("telephone", String(form.get("tel")));
    body.append("claimType", TYPES[type] ?? type);
    body.append("concernedOperator", OPERATEURS[operateur] ?? operateur);
    body.append("claimDescriptionFr", String(form.get("description")));
    for (const fichier of form.getAll("pieces")) {
      if (fichier instanceof File && fichier.size > 0) body.append("attachments", fichier);
    }

    try {
      await apiFetch("/claims", { method: "POST", body });
      setEnvoye(true);
      toast.success(t("submitSuccess"));
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : t("genericError"));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <>
      <PageHero surtitre={hero.surtitre} titre={hero.titre} description={hero.description} />

      <section className="section-y bg-surface-fade">
        <div className="container-content grid gap-8 xl:grid-cols-[0.82fr_1.45fr] xl:items-start">
          <aside className="space-y-5 xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-soft">
              <div className="bg-institution px-5 py-5 text-primary-foreground">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15">
                  <ClipboardCheck className="size-5" aria-hidden />
                </div>
                <h2 className="mt-3 font-heading text-lg font-semibold">{t("beforeAuthority")}</h2>
              </div>
              <ol className="p-5">
                {etapes.map((e, i) => (
                  <li key={i} className="relative flex gap-3.5 pb-6 last:pb-0">
                    {i < etapes.length - 1 && <span className="absolute top-8 left-4 h-[calc(100%-1.25rem)] w-px bg-border" aria-hidden />}
                    <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary ring-4 ring-card">
                      0{i + 1}
                    </span>
                    <p className="pt-1 text-sm leading-6 text-muted-foreground">{e.texte}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-foreground"><Info className="size-4" aria-hidden /></span>
                <div>
                  <h2 className="font-heading text-base font-semibold">{guide.titre}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{guide.description}</p>
                </div>
              </div>
              {rightsDocument?.fileUrl && (
                <Button asChild variant="outline" size="sm" className="mt-4 w-full justify-between">
                  <a href={rightsDocument.fileUrl} target="_blank" rel="noreferrer">
                    <span className="inline-flex items-center gap-2"><FileDown className="size-4" aria-hidden /> {t("downloadGuide")}</span><ChevronRight className="size-4" aria-hidden />
                  </a>
                </Button>
              )}
            </div>
          </aside>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border bg-surface/70 px-6 py-5 sm:px-8">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" aria-hidden /></span>
                <div>
                  <p className="font-heading text-xs font-semibold tracking-[0.14em] text-primary uppercase">ARPT Guinée</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("requiredFieldsNote")}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2" aria-label="Progression du dépôt">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="h-1.5 rounded-full bg-primary/20 first:bg-primary" aria-hidden />
                ))}
              </div>
            </div>
            <div className="p-6 sm:p-8">
            {authLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{t("loading")}</p>
            ) : !user ? (
              <div className="py-10 text-center">
                <LogIn className="mx-auto size-12 text-primary" aria-hidden />
                <h2 className="mt-4 font-heading text-xl font-semibold">{t("loginRequiredTitle")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t("loginRequiredBody")}</p>
                <Button asChild className="mt-6">
                  <AuthTrigger>{t("loginOrCreateAccount")}</AuthTrigger>
                </Button>
              </div>
            ) : !user.emailVerified ? (
              <VerificationEmail email={user.email} onVerified={refreshUser} />
            ) : envoye ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
                <h2 className="mt-4 font-heading text-xl font-semibold">{t("submittedTitle")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t("submittedBody")}</p>
                <Button asChild className="mt-6">
                  <Link href="/portail">{t("trackMyFile")}</Link>
                </Button>
              </div>
            ) : gateStep === "question" ? (
              <div className="py-10 text-center">
                <HelpCircle className="mx-auto size-12 text-primary" aria-hidden />
                <h2 className="mt-4 font-heading text-xl font-semibold">{t("gateQuestion")}</h2>
                <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3">
                  <Button onClick={() => setGateStep("form")}>
                    <ThumbsUp className="size-4" aria-hidden /> {t("gateYes")}
                  </Button>
                  <Button variant="outline" onClick={() => setGateStep("notYet")}>
                    <ThumbsDown className="size-4" aria-hidden /> {t("gateNo")}
                  </Button>
                </div>
              </div>
            ) : gateStep === "notYet" ? (
              <div className="py-10 text-center">
                <HelpCircle className="mx-auto size-12 text-primary" aria-hidden />
                <h2 className="mt-4 font-heading text-xl font-semibold">{t("gateNotYetTitle")}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("gateNotYetBody")}</p>
                <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3">
                  <Button onClick={() => setGateStep("question")}>{t("back")}</Button>
                  <button
                    type="button"
                    onClick={() => setGateStep("form")}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t("gateContinueAnyway")}
                  </button>
                </div>
              </div>
            ) : (
              <form className="grid gap-6" onSubmit={soumettre}>
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-primary"><ClipboardCheck className="size-4" aria-hidden /></span>
                  <div>
                  <h2 className="font-heading text-xl font-semibold">{t("formTitle")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("descriptionPlaceholder")}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface/45 p-4 sm:p-5">
                  <p className="text-xs font-medium text-muted-foreground">{t("claimantNote")}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <User className="size-4 text-muted-foreground" aria-hidden /> {user.fullname}
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4" aria-hidden /> {user.email}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:max-w-xs">
                    <Label htmlFor="tel">{t("phone")}</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input id="tel" name="tel" type="tel" maxLength={20} className="pl-10" placeholder="+224 …" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 rounded-xl border border-border bg-surface/45 p-4 sm:grid-cols-2 sm:p-5">
                  <div className="grid gap-2">
                    <Label htmlFor="type">{t("claimType")}</Label>
                    <div className="relative">
                      <ShieldAlert className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Select value={type} onValueChange={setType} required>
                        <SelectTrigger id="type" className="pl-10">
                          <SelectValue placeholder={t("claimTypePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPES).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="operateur">{t("operator")}</Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Select value={operateur} onValueChange={setOperateur} required>
                        <SelectTrigger id="operateur" className="pl-10">
                          <SelectValue placeholder={t("operatorPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(OPERATEURS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">{t("description")}</Label>
                  <div className="relative">
                    <MessageSquare className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" aria-hidden />
                    <Textarea
                      id="description"
                      name="description"
                      required
                      rows={6}
                      maxLength={2000}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="min-h-40 pl-10"
                      placeholder={t("descriptionPlaceholder")}
                    />
                  </div>
                  <p className="text-right text-xs tabular-nums text-muted-foreground">{description.length}/2000</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pieces">{t("attachments")}</Label>
                  <div className="relative rounded-xl border border-dashed border-primary/30 bg-surface/55 p-3 transition-colors hover:border-primary/60">
                    <Paperclip className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-primary" aria-hidden />
                    <Input id="pieces" name="pieces" type="file" multiple accept=".pdf,.jpg,.png" className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("acceptedFormats")}</p>
                </div>

                {erreur && <p className="text-sm text-destructive" role="alert">{erreur}</p>}

                <div className="flex border-t border-border pt-5 sm:justify-end">
                  <Button type="submit" size="lg" disabled={envoiEnCours} className="shrink-0 gap-2">
                    <Send className="size-4" aria-hidden /> {envoiEnCours ? t("submitting") : t("submit")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
        </div>
      </section>
    </>
  );
}

function VerificationEmail({ email, onVerified }: { email: string; onVerified: () => Promise<void> }) {
  const t = useTranslations("claims");
  const [otp, setOtp] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");

  async function verifier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    setEnvoiEnCours(true);
    try {
      await api.post("/auth/email-verification/verify", { otp });
      await onVerified();
      toast.success(t("verifyEmailSuccess"));
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : t("invalidCode"));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function renvoyer() {
    setRenvoiEnCours(true);
    setInfo("");
    try {
      await api.post("/auth/email-verification/resend");
      setInfo(t("resendCodeSuccess"));
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : t("resendCodeError"));
    } finally {
      setRenvoiEnCours(false);
    }
  }

  return (
    <div className="py-6 text-center">
      <Mail className="mx-auto size-12 text-primary" aria-hidden />
      <h2 className="mt-4 font-heading text-xl font-semibold">{t("verifyEmailTitle")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("verifyEmailBody", { email })}</p>
      <form onSubmit={verifier} className="mx-auto mt-6 grid max-w-xs gap-3">
        <Input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          inputMode="numeric"
          placeholder="123456"
          className="text-center tracking-[0.3em]"
          required
        />
        {erreur && <p className="text-sm text-destructive" role="alert">{erreur}</p>}
        {info && <p className="text-sm text-success">{info}</p>}
        <Button type="submit" disabled={envoiEnCours}>
          {envoiEnCours ? t("verifying") : t("verify")}
        </Button>
        <button
          type="button"
          onClick={renvoyer}
          disabled={renvoiEnCours}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          {renvoiEnCours ? t("resending") : t("resendCode")}
        </button>
      </form>
    </div>
  );
}
