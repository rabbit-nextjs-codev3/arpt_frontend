"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formaterDate, offresEmploi } from "@/data/mock";

export default function OffreDetail() {
  const { id } = useParams<{ id: string }>();
  const offre = offresEmploi.find((o) => String(o.id) === id);
  const [envoye, setEnvoye] = useState(false);

  if (!offre) {
    return (
      <div className="container-content section-y text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted">
          <Search className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Offre introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette offre n'existe plus ou a peut-être été pourvue.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/carrieres">
            <ArrowLeft className="size-4" aria-hidden /> Retour aux offres
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="section-y">
      <div className="container-content grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
          <Link
            href="/carrieres"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden /> Toutes les offres
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className="font-mono text-xs font-semibold"
            >
              {offre.code}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 text-xs font-medium text-destructive"
            >
              <CalendarDays className="size-3.5" aria-hidden /> Clôture le{" "}
              {formaterDate(offre.limite)}
            </Badge>
          </div>

          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {offre.intitule}
          </h1>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4" aria-hidden /> {offre.departement}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden /> {offre.lieu}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> Publiée le{" "}
              {formaterDate(offre.publication)}
            </span>
          </div>

          <p className="mt-8 leading-8 text-foreground/90">
            {offre.description}
          </p>

          <Bloc
            titre="Missions principales"
            items={offre.missions}
            icone={CheckCircle2}
          />
          <Bloc
            titre="Profil recherché"
            items={offre.profil}
            icone={CheckCircle2}
          />
          <Bloc titre="Avantages" items={offre.avantages} icone={Sparkles} />
        </div>

        <div className="rounded-xl max-w-7xl border border-border bg-card p-6 sm:p-7 lg:sticky lg:top-40">
          <h2 className="font-heading text-lg font-semibold">
            Postuler à cette offre
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre dossier sera transmis à {offre.contactName} (
            {offre.contactEmail}).
          </p>

          {envoye ? (
            <div className="mt-6 rounded-lg border border-success/40 bg-success/10 p-5 text-sm">
              <p className="font-semibold text-success">
                Candidature enregistrée
              </p>
              <p className="mt-1 text-muted-foreground">
                Vous pouvez suivre son avancement depuis votre portail usager.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/portail">Ouvrir le portail</Link>
              </Button>
            </div>
          ) : (
            <form
              className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                setEnvoye(true);
                toast.success("Votre candidature a bien été transmise.");
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="nom">Nom complet</Label>
                <Input
                  id="nom"
                  required
                  maxLength={120}
                  placeholder="Prénom et nom"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  maxLength={255}
                  placeholder="vous@exemple.gn"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dispo">Date de disponibilité</Label>
                <Input id="dispo" type="date" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cv">CV (PDF)</Label>
                <Input
                  id="cv"
                  type="file"
                  accept=".pdf"
                  required
                  className="file:text-primary"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="lettre">Lettre de motivation</Label>
                <Textarea
                  id="lettre"
                  required
                  maxLength={2000}
                  rows={5}
                  placeholder="Présentez votre parcours…"
                />
              </div>
              <Separator className="sm:col-span-2" />
              <Button type="submit" className="sm:col-span-2">
                Envoyer ma candidature
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Bloc({
  titre,
  items,
  icone: Icone,
}: {
  titre: string;
  items: string[];
  icone: typeof CheckCircle2;
}) {
  return (
    <div className="mt-9">
      <h2 className="font-heading text-lg font-semibold">{titre}</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm leading-relaxed"
          >
            <Icone
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden
            />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
