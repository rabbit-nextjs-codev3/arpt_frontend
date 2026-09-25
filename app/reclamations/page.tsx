"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
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
  Send,
  ShieldAlert,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
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
import { apiFetch, ApiError } from "@/lib/api";
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
  serviceValues?: string;
}
interface LocationItem {
  region: string;
  commune: string;
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
  {
    texte:
      "Contactez d'abord le service client de votre opérateur et conservez la référence du dossier.",
  },
  {
    texte:
      "Si aucune réponse satisfaisante n'est apportée sous 30 jours, saisissez l'ARPT via ce formulaire.",
  },
  {
    texte:
      "Un agent instruit votre dossier et vous informe de l'avancement depuis votre portail usager.",
  },
];

const OPERATEURS_DEFAUT: ChoiceItem[] = [
  { value: "orange", label: "Orange Guinée" },
  { value: "areeba", label: "Areeba Guinée" },
  { value: "cellcom", label: "Cellcom Guinée" },
  { value: "poste-guineenne", label: "La Poste Guinéenne" },
  { value: "dhl-guinee", label: "DHL International Guinée" },
  { value: "moka-express", label: "Moka Express" },
  { value: "nimba-plus", label: "Nimba Plus" },
  { value: "autre", label: "Autre opérateur" },
];

const TYPES_DEFAUT: ChoiceItem[] = [
  { value: "qualite", label: "Qualité de service" },
  { value: "facturation", label: "Facturation" },
  { value: "reseau", label: "Réseau / couverture" },
  { value: "autre", label: "Autre" },
];

const SERVICES_DEFAUT: ChoiceItem[] = [
  { value: "mobile", label: "Téléphonie mobile" },
  { value: "internet", label: "Accès Internet" },
  // { value: "fixe", label: "Téléphonie fixe" },
  { value: "postal", label: "Services postaux" },
  { value: "numerique", label: "Services numériques et à valeur ajoutée" },
  { value: "autre", label: "Autre service régulé" },
];
const LOCATIONS_DEFAUT: LocationItem[] = [
  { region: "Conakry", commune: "Kaloum" },
];

const GUIDE_DEFAUT: GuideContent = {
  titre: "Droits des consommateurs",
  description:
    "Guide officiel des droits et recours des usagers des services de télécommunications.",
};

function ChampObligatoire({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <input
        type="hidden"
        name={`${htmlFor}-required`}
        value="true"
        aria-required="true"
      />
    </Label>
  );
}

export default function Reclamations() {
  const t = useTranslations("claims");
  const { user, loading: authLoading } = useAuth();
  const { data: hero } = useContentBlock<HeroContent>(
    "claims.hero",
    HERO_DEFAUT,
  );
  const { data: etapes } = useContentBlock<StepItem[]>(
    "claims.steps",
    ETAPES_DEFAUT,
  );
  const { data: operateursListe } = useContentBlock<ChoiceItem[]>(
    "claims.operators",
    OPERATEURS_DEFAUT,
  );
  const { data: typesListe } = useContentBlock<ChoiceItem[]>(
    "claims.types",
    TYPES_DEFAUT,
  );
  const { data: servicesListe } = useContentBlock<ChoiceItem[]>(
    "claims.services",
    SERVICES_DEFAUT,
  );
  const { data: locations } = useContentBlock<LocationItem[]>(
    "claims.locations",
    LOCATIONS_DEFAUT,
  );
  const { data: guide } = useContentBlock<GuideContent>(
    "claims.guide",
    GUIDE_DEFAUT,
  );
  const { data: rightsDocument } = useApiOne<{ fileUrl: string | null }>(
    "/consumer-rights-document",
  );
  const OPERATEURS: Record<string, string> = Object.fromEntries(
    operateursListe.map((o) => [o.value, o.label]),
  );
  const TYPES: Record<string, string> = Object.fromEntries(
    typesListe.map((o) => [o.value, o.label]),
  );
  const [envoye, setEnvoye] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [region, setRegion] = useState("");
  const [commune, setCommune] = useState("");
  const [service, setService] = useState("");
  const [type, setType] = useState("");
  const [operateur, setOperateur] = useState("");
  const [description, setDescription] = useState("");
  const regions = Array.from(new Set(locations.map((item) => item.region)));
  const communes = locations
    .filter((item) => item.region === region)
    .map((item) => item.commune);
  const servicesDisponibles = servicesListe.filter(
    (item) => item.value !== "fixe",
  );
  const typesFiltres = typesListe.filter(
    (item) =>
      !item.serviceValues ||
      item.serviceValues
        .split(",")
        .map((v) => v.trim())
        .includes(service),
  );
  const operateursFiltres = operateursListe.filter(
    (item) =>
      !item.serviceValues ||
      item.serviceValues
        .split(",")
        .map((v) => v.trim())
        .includes(service),
  );
  // Le parcours impose une démarche préalable auprès de l'opérateur.
  // Le backend exige aussi sa confirmation avant le dépôt.
  const [gateStep, setGateStep] = useState<"question" | "notYet" | "form">(
    "question",
  );
  const [gateUserId, setGateUserId] = useState<number | null>(null);
  const activeGateStep = gateUserId === user?.id ? gateStep : "question";
  const claimSubmittedForCurrentUser = envoye && gateUserId === user?.id;
  const progressStep = claimSubmittedForCurrentUser
    ? 3
    : activeGateStep === "form"
      ? 2
      : 1;

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    if (activeGateStep !== "form") {
      setGateStep("question");
      return;
    }
    if (!region || !commune || !service || !type || !operateur) {
      setErreur(t("submitError"));
      return;
    }
    setEnvoiEnCours(true);
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    body.append("operatorContacted", "true");
    body.append("claimType", TYPES[type] ?? type);
    body.append("concernedOperator", OPERATEURS[operateur] ?? operateur);
    body.append(
      "claimDescriptionFr",
      [
        "Région : " + region,
        "Préfecture / commune : " + commune,
        "Service concerné : " +
          (servicesDisponibles.find((item) => item.value === service)?.label ??
            service),
        "",
        String(form.get("description")),
      ].join("\n"),
    );
    for (const fichier of form.getAll("pieces")) {
      if (fichier instanceof File && fichier.size > 0)
        body.append("attachments", fichier);
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
      <PageHero
        surtitre={hero.surtitre}
        titre={hero.titre}
        description={hero.description}
      />

      <section className="section-y bg-surface-fade">
        <div className="container-content grid gap-8 md:grid-cols-[0.82fr_1.45fr] xl:items-start">
          <aside className="space-y-5 xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-soft">
              <div className="bg-institution px-5 py-5 text-primary-foreground">
                <div className="flex size-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
                  <ClipboardCheck className="size-5" aria-hidden />
                </div>
                <h2 className="mt-3 font-heading text-lg font-semibold">
                  {t("beforeAuthority")}
                </h2>
              </div>
              <ol className="p-5">
                {etapes.map((e, i) => (
                  <li key={i} className="relative flex gap-3.5 pb-6 last:pb-0">
                    {i < etapes.length - 1 && (
                      <span
                        className="absolute top-8 left-4 h-[calc(100%-1.25rem)] w-px bg-border"
                        aria-hidden
                      />
                    )}
                    <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-teal-500 text-xs font-bold text-primary ring-4 ring-card">
                      0{i + 1}
                    </span>
                    <p className="pt-1 text-sm leading-6 text-muted-foreground">
                      {e.texte}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
                  <Info className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="font-heading text-base font-semibold">
                    {guide.titre}
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {guide.description}
                  </p>
                </div>
              </div>
              {rightsDocument?.fileUrl && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full hover:!bg-teal-600/10 hover:text-teal-600 justify-between"
                >
                  <a href={rightsDocument.fileUrl} data-document-preview>
                    <span className="inline-flex items-center gap-2">
                      <FileDown className="size-4" aria-hidden /> Aperçu du
                      guide officiel
                    </span>
                    <ChevronRight className="size-4" aria-hidden />
                  </a>
                </Button>
              )}
            </div>
          </aside>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border bg-surface/70 px-6 py-5 sm:px-8">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
                  <ShieldCheck className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-heading text-xs font-semibold tracking-[0.14em] text-teal-700 uppercase">
                    ARPT Guinée
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("requiredFieldsNote")}
                  </p>
                </div>
              </div>
              <div
                className="mt-5 grid grid-cols-3 gap-2"
                aria-label="Progression du dépôt"
              >
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={
                      step <= progressStep
                        ? "h-1.5 rounded-full bg-teal-600"
                        : "h-1.5 rounded-full bg-teal-600/20"
                    }
                    aria-hidden
                  />
                ))}
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {authLoading ? (
                <Loader
                  className="flex justify-center py-10"
                  label={t("loading")}
                />
              ) : !user ? (
                <div className="py-10 text-center">
                  <LogIn className="mx-auto size-12 text-primary" aria-hidden />
                  <h2 className="mt-4 font-heading text-xl font-semibold">
                    {t("loginRequiredTitle")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("loginRequiredBody")}
                  </p>
                  <Button asChild className="mt-6">
                    <AuthTrigger>{t("loginOrCreateAccount")}</AuthTrigger>
                  </Button>
                </div>
              ) : claimSubmittedForCurrentUser ? (
                <div className="py-10 text-center">
                  <CheckCircle2
                    className="mx-auto size-12 text-success"
                    aria-hidden
                  />
                  <h2 className="mt-4 font-heading text-xl font-semibold">
                    {t("submittedTitle")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("submittedBody")}
                  </p>
                  <Button asChild className="mt-6">
                    <Link href="/portail">{t("trackMyFile")}</Link>
                  </Button>
                </div>
              ) : activeGateStep === "question" ? (
                <div className="py-10 text-center">
                  <HelpCircle
                    className="mx-auto size-12 text-teal-600"
                    aria-hidden
                  />
                  <h2 className="mt-4 font-heading text-xl font-semibold">
                    {t("gateQuestion")}
                  </h2>
                  <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3">
                    <Button
                      onClick={() => {
                        setGateUserId(user.id);
                        setGateStep("form");
                      }}
                    >
                      <ThumbsUp className="size-4" aria-hidden /> {t("gateYes")}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-border text-muted-foreground hover:bg-teal-600/10 hover:text-teal-600"
                      onClick={() => {
                        setGateUserId(user.id);
                        setGateStep("notYet");
                      }}
                    >
                      <ThumbsDown className="size-4" aria-hidden />{" "}
                      {t("gateNo")}
                    </Button>
                  </div>
                </div>
              ) : activeGateStep === "notYet" ? (
                <div className="py-10 text-center">
                  <HelpCircle
                    className="mx-auto size-12 text-teal-600"
                    aria-hidden
                  />
                  <h2 className="mt-4 font-heading text-xl font-semibold">
                    {t("gateNotYetTitle")}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {t("gateNotYetBody")}
                  </p>
                  <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3">
                    <Button onClick={() => setGateStep("question")}>
                      {t("back")}
                    </Button>
                  </div>
                </div>
              ) : (
                <form className="grid gap-6" onSubmit={soumettre}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-teal-600 text-white shadow transition-colors hover:bg-teal-700">
                      <ClipboardCheck className="size-4" aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-heading text-xl font-semibold">
                        {t("formTitle")}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("descriptionPlaceholder")}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-surface/45 p-4 sm:p-5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("claimantNote")}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <User
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />{" "}
                        {user.fullname}
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="size-4" aria-hidden /> {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-5 rounded-xl border border-border bg-surface/45 p-4 sm:grid-cols-2 sm:p-5">
                    <div className="grid gap-2">
                      <ChampObligatoire htmlFor="region">
                        Région
                      </ChampObligatoire>
                      <Select
                        value={region}
                        onValueChange={(value) => {
                          setRegion(value);
                          setCommune("");
                        }}
                        required
                      >
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Sélectionner une région" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <ChampObligatoire htmlFor="commune">
                        Préfecture / commune
                      </ChampObligatoire>
                      <Select
                        value={commune}
                        onValueChange={setCommune}
                        disabled={!region}
                        required
                      >
                        <SelectTrigger id="commune">
                          <SelectValue
                            placeholder={
                              region
                                ? "Sélectionner la localité"
                                : "Choisissez la région"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {communes.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <ChampObligatoire htmlFor="service">
                        Service concerné
                      </ChampObligatoire>
                      <Select
                        value={service}
                        onValueChange={(value) => {
                          setService(value);
                          setType("");
                          setOperateur("");
                        }}
                        required
                      >
                        <SelectTrigger id="service">
                          <SelectValue placeholder="Sélectionner un service" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicesDisponibles.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <ChampObligatoire htmlFor="type">
                        {/* {t("claimType")} */}
                        Type de réclamation
                      </ChampObligatoire>
                      <div className="relative">
                        <ShieldAlert
                          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden
                        />
                        <Select value={type} onValueChange={setType} required>
                          <SelectTrigger id="type" className="pl-10">
                            <SelectValue
                              placeholder={t("claimTypePlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {typesFiltres.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <ChampObligatoire htmlFor="operateur">
                        {/* {t("operator")} */}
                        Operateur concerné
                      </ChampObligatoire>
                      <div className="relative">
                        <Building2
                          className="pointer-events-none absolute top-1/2 left-3 z-10
                         size-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden
                        />
                        <Select
                          value={operateur}
                          onValueChange={setOperateur}
                          required
                        >
                          <SelectTrigger id="operateur" className="pl-10">
                            <SelectValue
                              placeholder={t("operatorPlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {operateursFiltres.map(({ value, label }) => (
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
                    <ChampObligatoire htmlFor="description">
                      {/* {t("description")} */}
                      Description
                    </ChampObligatoire>
                    <div className="relative">
                      <MessageSquare
                        className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
                        aria-hidden
                      />
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
                    <p className="text-right text-xs tabular-nums text-muted-foreground">
                      {description.length}/2000
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <ChampObligatoire htmlFor="pieces">
                      {t("attachments")}
                    </ChampObligatoire>
                    <div className="relative rounded-xl border border-dashed border-primary/30 bg-surface/55 p-3 transition-colors hover:border-primary/60">
                      <Paperclip
                        className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-primary"
                        aria-hidden
                      />
                      <Input
                        required
                        id="pieces"
                        name="pieces"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.png"
                        className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("acceptedFormats")}
                    </p>
                  </div>

                  {erreur && (
                    <p className="text-sm text-destructive" role="alert">
                      {erreur}
                    </p>
                  )}

                  <div className="flex border-t border-border pt-5 sm:justify-end">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={envoiEnCours}
                      className="shrink-0 gap-2"
                    >
                      <Send className="size-4" aria-hidden />{" "}
                      {envoiEnCours ? t("submitting") : t("submit")}
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
