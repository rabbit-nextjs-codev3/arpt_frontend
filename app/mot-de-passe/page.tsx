"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

type Etape = "email" | "otp" | "mot-de-passe" | "termine";

/**
 * Sert deux usages avec le même cycle backend (/auth/password-reset/*) :
 * mot de passe oublié, et première définition du mot de passe pour un
 * compte créé par un admin (voir UsersService.createByAdmin — email
 * d'invitation avec le même OTP).
 */
export default function MotDePasse() {
  const [etape, setEtape] = useState<Etape>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function demanderCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    setEnvoiEnCours(true);
    try {
      const data = new FormData(event.currentTarget);
      const saisie = String(data.get("email"));
      await api.post("/auth/password-reset/request-otp", { email: saisie });
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
      const res = await api.post<{ valid: true; resetToken: string }>("/auth/password-reset/verify-otp", {
        email,
        otp: String(data.get("otp")),
      });
      setResetToken(res.resetToken);
      setEtape("mot-de-passe");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function definirMotDePasse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur("");
    const data = new FormData(event.currentTarget);
    const newPassword = String(data.get("newPassword"));
    const confirmPassword = String(data.get("confirmPassword"));
    if (newPassword !== confirmPassword) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    setEnvoiEnCours(true);
    try {
      await api.post("/auth/password-reset/reset", { email, resetToken, newPassword, confirmPassword });
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
        surtitre="Mon compte"
        titre="Définir mon mot de passe"
        description="Que vous ayez oublié votre mot de passe ou que votre compte vienne d'être créé, la procédure est la même."
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
                  <Label htmlFor="email">Adresse e-mail</Label>
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
                  Si ce compte existe, un code à 6 chiffres a été envoyé à {email}.
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

            {etape === "mot-de-passe" && (
              <form onSubmit={definirMotDePasse} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" placeholder="Au moins 8 caractères" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
                </div>
                {erreur && <p role="alert" className="text-sm text-destructive">{erreur}</p>}
                <Button type="submit" disabled={envoiEnCours}>
                  {envoiEnCours ? "Enregistrement…" : "Définir le mot de passe"}
                </Button>
              </form>
            )}

            {etape === "termine" && (
              <div className="grid gap-3 text-center">
                <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
                <p className="text-sm leading-6 text-foreground">Mot de passe défini avec succès.</p>
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
