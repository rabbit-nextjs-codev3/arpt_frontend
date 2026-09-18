"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiFetch, ApiError } from "@/lib/api";

type Etape = "email" | "otp" | "document" | "termine";

export default function CompteEntreprise() {
  const [etape, setEtape] = useState<Etape>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [messageFinal, setMessageFinal] = useState("");

  async function demanderCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    setEnvoiEnCours(true);
    try {
      const data = new FormData(event.currentTarget);
      const saisie = String(data.get("email"));
      await api.post("/auth/enterprise-document/request-otp", { email: saisie });
      setEmail(saisie);
      setEtape("otp");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function verifierCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    setEnvoiEnCours(true);
    try {
      const data = new FormData(event.currentTarget);
      const res = await api.post<{ valid: true; resetToken: string }>("/auth/enterprise-document/verify-otp", {
        email,
        otp: String(data.get("otp")),
      });
      setResetToken(res.resetToken);
      setEtape("document");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function envoyerDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    setEnvoiEnCours(true);
    try {
      const data = new FormData(event.currentTarget);
      const document = data.get("companyDocument");
      if (!(document instanceof File) || document.size === 0) {
        setErreur("Merci de sélectionner un document.");
        return;
      }
      const body = new FormData();
      body.append("email", email);
      body.append("resetToken", resetToken);
      body.append("companyDocument", document);
      const res = await apiFetch<{ detail: string }>("/auth/enterprise-document/resubmit", {
        method: "POST",
        body,
      });
      setMessageFinal(res.detail);
      setEtape("termine");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <>
      <PageHero
        surtitre="Compte entreprise"
        titre="Soumettre un nouveau document"
        description="Si votre demande de compte entreprise a été rejetée, vous pouvez soumettre un nouveau document justificatif sans avoir à vous connecter."
      />

      <section className="section-y">
        <div className="container-content max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> Retour à l&apos;accueil
          </Link>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
            {etape === "email" && (
              <form onSubmit={demanderCode} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Adresse e-mail du compte entreprise</Label>
                  <Input id="email" name="email" type="email" required maxLength={254} placeholder="vous@exemple.com" />
                </div>
                {erreur && <p role="alert" className="text-sm text-destructive">{erreur}</p>}
                <Button type="submit" disabled={envoiEnCours}>
                  {envoiEnCours ? "Envoi…" : "Recevoir un code"}
                </Button>
              </form>
            )}

            {etape === "otp" && (
              <form onSubmit={verifierCode} className="grid gap-4">
                <p className="text-sm text-muted-foreground">
                  Si ce compte peut soumettre un nouveau document, un code à 6 chiffres a été envoyé à {email}.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="otp">Code reçu par e-mail</Label>
                  <Input id="otp" name="otp" required minLength={6} maxLength={6} placeholder="123456" />
                </div>
                {erreur && <p role="alert" className="text-sm text-destructive">{erreur}</p>}
                <Button type="submit" disabled={envoiEnCours}>
                  {envoiEnCours ? "Vérification…" : "Vérifier le code"}
                </Button>
              </form>
            )}

            {etape === "document" && (
              <form onSubmit={envoyerDocument} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyDocument">Nouveau document justificatif (RCCM ou équivalent)</Label>
                  <Input id="companyDocument" name="companyDocument" type="file" required accept=".pdf,.jpg,.jpeg,.png" />
                  <p className="text-xs text-muted-foreground">PDF, JPG ou PNG.</p>
                </div>
                {erreur && <p role="alert" className="text-sm text-destructive">{erreur}</p>}
                <Button type="submit" disabled={envoiEnCours}>
                  {envoiEnCours ? "Envoi…" : "Envoyer le document"}
                </Button>
              </form>
            )}

            {etape === "termine" && (
              <div className="grid gap-3 text-center">
                <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
                <p className="text-sm leading-6 text-foreground">{messageFinal}</p>
                <Button asChild variant="outline" className="justify-self-center">
                  <Link href="/">Retour à l&apos;accueil</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
