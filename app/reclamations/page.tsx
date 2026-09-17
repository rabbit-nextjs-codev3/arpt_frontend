"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  FileDown,
  Info,
  LogIn,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  ShieldAlert,
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

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    if (!type || !operateur) {
      setErreur("Merci de sélectionner la nature de la réclamation et l'opérateur concerné.");
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
      toast.success("Votre réclamation a bien été déposée.");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
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
                <Info className="size-5 text-primary" aria-hidden /> Avant de saisir l'Autorité
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
                    <FileDown className="size-4" aria-hidden /> Télécharger le guide
                  </a>
                </Button>
              )}
            </div>
          </aside>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
            {authLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>
            ) : !user ? (
              <div className="py-10 text-center">
                <LogIn className="mx-auto size-12 text-primary" aria-hidden />
                <h2 className="mt-4 font-heading text-xl font-semibold">Connexion requise</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pour pouvoir suivre votre dossier, une réclamation doit être rattachée à un compte usager.
                </p>
                <Button asChild className="mt-6">
                  <AuthTrigger>Se connecter ou créer un compte</AuthTrigger>
                </Button>
              </div>
            ) : !user.emailVerified ? (
              <VerificationEmail email={user.email} onVerified={refreshUser} />
            ) : envoye ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
                <h2 className="mt-4 font-heading text-xl font-semibold">Réclamation enregistrée</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Une référence de suivi vous a été adressée par courriel. L'instruction débute sous 48 heures ouvrées.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/portail">Suivre mon dossier</Link>
                </Button>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={soumettre}>
                <div>
                  <h2 className="font-heading text-xl font-semibold">Formulaire de réclamation</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Les champs marqués d'un astérisque (*) sont obligatoires.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="prenom">Prénom *</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input id="prenom" name="prenom" required maxLength={80} className="pl-10" placeholder="Ex. : Mamadou" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input id="nom" name="nom" required maxLength={80} className="pl-10" placeholder="Ex. : Diallo" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Adresse e-mail *</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input id="email" name="email" type="email" required maxLength={255} defaultValue={user.email} className="pl-10" placeholder="vous@exemple.com" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tel">Téléphone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input id="tel" name="tel" type="tel" maxLength={20} className="pl-10" placeholder="+224 …" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Nature de la réclamation *</Label>
                    <div className="relative">
                      <ShieldAlert className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Select value={type} onValueChange={setType} required>
                        <SelectTrigger id="type" className="pl-10">
                          <SelectValue placeholder="Sélectionnez la nature" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUALITE">Qualité de service</SelectItem>
                          <SelectItem value="FACTURATION">Facturation</SelectItem>
                          <SelectItem value="RESEAU">Réseau / couverture</SelectItem>
                          <SelectItem value="AUTRE">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="operateur">Opérateur concerné *</Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Select value={operateur} onValueChange={setOperateur} required>
                        <SelectTrigger id="operateur" className="pl-10">
                          <SelectValue placeholder="Sélectionnez l'opérateur" />
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
                  <Label htmlFor="description">Description des faits *</Label>
                  <div className="relative">
                    <MessageSquare className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" aria-hidden />
                    <Textarea
                      id="description"
                      name="description"
                      required
                      rows={6}
                      maxLength={2000}
                      className="pl-10"
                      placeholder="Dates, montants, références de dossier, démarches déjà effectuées…"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pieces">Pièces justificatives (facultatif)</Label>
                  <div className="relative">
                    <Paperclip className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input id="pieces" name="pieces" type="file" multiple accept=".pdf,.jpg,.png" className="pl-10" />
                  </div>
                  <p className="text-xs text-muted-foreground">Formats acceptés : PDF, JPG, PNG.</p>
                </div>

                {erreur && <p className="text-sm text-destructive" role="alert">{erreur}</p>}

                <Button type="submit" size="lg" disabled={envoiEnCours} className="mt-1 justify-self-start">
                  {envoiEnCours ? "Envoi en cours…" : "Déposer ma réclamation"}
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
      toast.success("Adresse e-mail vérifiée.");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Code invalide, réessayez.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function renvoyer() {
    setRenvoiEnCours(true);
    setInfo("");
    try {
      await api.post("/auth/email-verification/resend");
      setInfo("Un nouveau code vous a été envoyé.");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible d'envoyer le code, réessayez.");
    } finally {
      setRenvoiEnCours(false);
    }
  }

  return (
    <div className="py-6 text-center">
      <Mail className="mx-auto size-12 text-primary" aria-hidden />
      <h2 className="mt-4 font-heading text-xl font-semibold">Vérifiez votre adresse e-mail</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Un code à 6 chiffres a été envoyé à {email} lors de votre inscription. Saisissez-le ci-dessous pour pouvoir
        déposer une réclamation.
      </p>
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
          {envoiEnCours ? "Vérification…" : "Vérifier"}
        </Button>
        <button
          type="button"
          onClick={renvoyer}
          disabled={renvoiEnCours}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          {renvoiEnCours ? "Envoi…" : "Renvoyer le code"}
        </button>
      </form>
    </div>
  );
}
