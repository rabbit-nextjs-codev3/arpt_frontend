"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Building2,
  CheckCircle2,
  FileDown,
  HelpCircle,
  Info,
  LogIn,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  ShieldAlert,
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

interface OperatorItem {
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

const OPERATEURS_DEFAUT: OperatorItem[] = [
  { value: "orange", label: "Orange Guinée" },
  { value: "mtn", label: "MTN Guinée" },
  { value: "cellcom", label: "Cellcom" },
  { value: "poste", label: "Guinée Poste" },
  { value: "autre", label: "Autre opérateur" },
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
  const { data: operateursListe } = useContentBlock<OperatorItem[]>("claims.operators", OPERATEURS_DEFAUT);
  const { data: guide } = useContentBlock<GuideContent>("claims.guide", GUIDE_DEFAUT);
  const { data: rightsDocument } = useApiOne<{ fileUrl: string | null }>("/consumer-rights-document");
  const OPERATEURS: Record<string, string> = Object.fromEntries(operateursListe.map((o) => [o.value, o.label]));
  const [envoye, setEnvoye] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [type, setType] = useState("");
  const [operateur, setOperateur] = useState("");
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
    body.append("firstname", String(form.get("prenom")));
    body.append("lastname", String(form.get("nom")));
    body.append("email", String(form.get("email")));
    if (form.get("tel")) body.append("telephone", String(form.get("tel")));
    body.append("claimType", type);
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

      <section className="section-y">
        <div className="container-content grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <aside className="space-y-8 lg:pr-6">
            <div className="border-b border-border pb-8">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
                <Info className="size-5 text-primary" aria-hidden /> {t("beforeAuthority")}
              </h2>
              <ol className="mt-4 space-y-4">
                {etapes.map((e, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                      {i + 1}
                    </span>
                    {e.texte}
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-b border-border pb-8">
              <h2 className="font-heading text-lg font-semibold">{guide.titre}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{guide.description}</p>
              {rightsDocument?.fileUrl && (
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <a href={rightsDocument.fileUrl} target="_blank" rel="noreferrer">
                    <FileDown className="size-4" aria-hidden /> {t("downloadGuide")}
                  </a>
                </Button>
              )}
            </div>
          </aside>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
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
              <form className="grid gap-5" onSubmit={soumettre}>
                <div>
                  <h2 className="font-heading text-xl font-semibold">{t("formTitle")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("requiredFieldsNote")}</p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="prenom">{t("firstname")}</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input id="prenom" name="prenom" required maxLength={80} className="pl-10" placeholder={t("firstnamePlaceholder")} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nom">{t("lastname")}</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input id="nom" name="nom" required maxLength={80} className="pl-10" placeholder={t("lastnamePlaceholder")} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input id="email" name="email" type="email" required maxLength={255} defaultValue={user.email} className="pl-10" placeholder="vous@exemple.com" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tel">{t("phone")}</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input id="tel" name="tel" type="tel" maxLength={20} className="pl-10" placeholder="+224 …" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="type">{t("claimType")}</Label>
                    <div className="relative">
                      <ShieldAlert className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Select value={type} onValueChange={setType} required>
                        <SelectTrigger id="type" className="pl-10">
                          <SelectValue placeholder={t("claimTypePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUALITE">{t("claimTypeOptions.quality")}</SelectItem>
                          <SelectItem value="FACTURATION">{t("claimTypeOptions.billing")}</SelectItem>
                          <SelectItem value="RESEAU">{t("claimTypeOptions.network")}</SelectItem>
                          <SelectItem value="AUTRE">{t("claimTypeOptions.other")}</SelectItem>
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
                      className="pl-10"
                      placeholder={t("descriptionPlaceholder")}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pieces">{t("attachments")}</Label>
                  <div className="relative">
                    <Paperclip className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input id="pieces" name="pieces" type="file" multiple accept=".pdf,.jpg,.png" className="pl-10" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("acceptedFormats")}</p>
                </div>

                {erreur && <p className="text-sm text-destructive" role="alert">{erreur}</p>}

                <Button type="submit" size="lg" disabled={envoiEnCours} className="mt-1 justify-self-start">
                  {envoiEnCours ? t("submitting") : t("submit")}
                </Button>
              </form>
            )}
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
