"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, ApiError } from "@/lib/auth";

const AuthContext = createContext<(() => void) | null>(null);

export function AuthTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const open = useContext(AuthContext);
  return <button type="button" onClick={() => open?.()} className={className} aria-haspopup="dialog">{children}</button>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus();
    };
  }, [open]);

  return (
    <AuthContext.Provider value={() => { trigger.current = document.activeElement as HTMLElement; setOpen(true); }}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false);
        }}
        className="auth-dialog fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm"
      >
        {open && <div className="relative p-6 sm:p-8">
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer la fenêtre" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"><X className="size-5" aria-hidden /></button>
          <div className="mb-5 text-center">
            <span className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5" strokeWidth={1.7} aria-hidden /></span>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Espace usager · ARPT</p>
            <h2 id={titleId} className="font-heading text-2xl font-semibold tracking-tight">Bienvenue sur votre espace</h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted-foreground">Un seul compte pour vos démarches, vos réclamations et leur suivi.</p>
          </div>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList aria-label="Accès au compte" className="mb-5 grid h-12 w-full grid-cols-2 rounded-xl bg-muted p-1">
              <TabsTrigger value="signin" className="h-10 rounded-lg">Connexion</TabsTrigger>
              <TabsTrigger value="signup" className="h-10 rounded-lg">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><AuthForm mode="signin" onSuccess={() => setOpen(false)} /></TabsContent>
            <TabsContent value="signup"><AuthForm mode="signup" onSuccess={() => setOpen(false)} /></TabsContent>
          </Tabs>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" aria-hidden />Votre espace personnel ARPT Guinée</p>
        </div>}
      </dialog>
    </AuthContext.Provider>
  );
}

function PasswordField({ id, label, confirm = false, signup = false }: { id: string; label: string; confirm?: boolean; signup?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <div className="grid gap-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input id={id} name={confirm ? "confirmation" : "password"} type={visible ? "text" : "password"} required minLength={signup ? 8 : 1} maxLength={128} autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "Au moins 8 caractères" : "Votre mot de passe"} aria-describedby={signup && !confirm ? `${id}-hint` : undefined} className="h-12 rounded-lg bg-card pr-12 shadow-none" />
      <button type="button" aria-label={`${visible ? "Masquer" : "Afficher"} ${confirm ? "la confirmation" : "le mot de passe"}`} aria-pressed={visible} onClick={() => setVisible(!visible)} className="absolute right-1 top-1 grid size-10 place-items-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">{visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}</button>
    </div>
    {signup && !confirm && <p id={`${id}-hint`} className="text-xs text-muted-foreground">Utilisez au moins 8 caractères.</p>}
  </div>;
}

function AuthForm({ mode, onSuccess }: { mode: "signin" | "signup"; onSuccess: () => void }) {
  const signup = mode === "signup";
  const id = useId();
  const { login, register } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (signup && data.get("password") !== data.get("confirmation")) {
      setError("Les mots de passe ne correspondent pas.");
      event.currentTarget.querySelector<HTMLInputElement>('[name="confirmation"]')?.focus();
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      if (signup) {
        await register(
          String(data.get("name")),
          String(data.get("email")),
          String(data.get("password")),
          String(data.get("confirmation")),
        );
      } else {
        await login(String(data.get("email")), String(data.get("password")), "public");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  return <form onSubmit={submit} className="grid items-start gap-x-5 gap-y-4 sm:grid-cols-2" onChange={() => setError("")}>
    {signup && <div className="grid gap-2"><Label htmlFor={`${id}-name`}>Nom complet</Label><Input id={`${id}-name`} name="name" autoComplete="name" required maxLength={120} placeholder="Prénom et nom" className="h-12 rounded-lg bg-card shadow-none" /></div>}
    <div className="grid gap-2"><Label htmlFor={`${id}-email`}>Adresse e-mail</Label><Input id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="vous@exemple.com" className="h-12 rounded-lg bg-card shadow-none" /></div>
    <PasswordField id={`${id}-password`} label="Mot de passe" signup={signup} />
    {signup && <PasswordField id={`${id}-confirm`} label="Confirmer le mot de passe" signup confirm />}
    {error && <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
    <Button type="submit" disabled={submitting} className="mt-1 h-12 w-full rounded-lg text-sm font-semibold sm:col-span-2">{submitting ? "Veuillez patienter…" : signup ? "Créer mon compte" : "Se connecter"}<ArrowRight className="size-4" aria-hidden /></Button>
    <p className="text-center text-xs leading-5 text-muted-foreground sm:col-span-2">{signup ? "Créez votre compte pour retrouver vos démarches au même endroit." : "Retrouvez vos dossiers et poursuivez vos démarches."}</p>
  </form>;
}
