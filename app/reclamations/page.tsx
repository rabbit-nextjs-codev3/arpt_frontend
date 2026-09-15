"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileDown, Info } from "lucide-react";
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

const etapes = [
  "Contactez d'abord le service client de votre opérateur et conservez la référence du dossier.",
  "Si aucune réponse satisfaisante n'est apportée sous 30 jours, saisissez l'ARPT via ce formulaire.",
  "Un agent instruit votre dossier et vous informe de l'avancement depuis votre portail usager.",
];

export default function Reclamations() {
  const [envoye, setEnvoye] = useState(false);

  return (
    <>
      <PageHero
        surtitre="Protection des consommateurs"
        titre="Déposer une réclamation"
        description="L'ARPT reçoit et instruit les litiges opposant les usagers aux opérateurs de télécommunications et aux opérateurs postaux."
      />

      <section className="section-y">
        <div className="container-content grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <aside className="space-y-8 lg:pr-6">
            <div className="border-b border-border pb-8">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
                <Info className="size-5 text-primary" aria-hidden /> Avant de
                saisir l'Autorité
              </h2>
              <ol className="mt-4 space-y-4">
                {etapes.map((e, i) => (
                  <li
                    key={e}
                    className="flex gap-3 text-sm text-muted-foreground"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                      {i + 1}
                    </span>
                    {e}
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-b border-border pb-8">
              <h2 className="font-heading text-lg font-semibold">
                Droits des consommateurs
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Guide officiel des droits et recours des usagers des services de
                télécommunications.
              </p>
              <Button variant="outline" size="sm" className="mt-4">
                <FileDown className="size-4" aria-hidden /> Télécharger le guide
              </Button>
            </div>
          </aside>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
            {envoye ? (
              <div className="py-10 text-center">
                <CheckCircle2
                  className="mx-auto size-12 text-success"
                  aria-hidden
                />
                <h2 className="mt-4 font-heading text-xl font-semibold">
                  Réclamation enregistrée
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Une référence de suivi vous a été adressée par courriel.
                  L'instruction débute sous 48 heures ouvrées.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/portail">Suivre mon dossier</Link>
                </Button>
              </div>
            ) : (
              <form
                className="grid gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEnvoye(true);
                  toast.success("Votre réclamation a bien été déposée.");
                }}
              >
                <h2 className="font-heading text-xl font-semibold">
                  Formulaire de réclamation
                </h2>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input id="prenom" required maxLength={80} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" required maxLength={80} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <Input id="email" type="email" required maxLength={255} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tel">Téléphone</Label>
                    <Input
                      id="tel"
                      type="tel"
                      maxLength={20}
                      placeholder="+224 …"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Nature de la réclamation</Label>
                    <Select required>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Sélectionner…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUALITE">
                          Qualité de service
                        </SelectItem>
                        <SelectItem value="FACTURATION">Facturation</SelectItem>
                        <SelectItem value="RESEAU">
                          Réseau / couverture
                        </SelectItem>
                        <SelectItem value="AUTRE">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="operateur">Opérateur concerné</Label>
                    <Select required>
                      <SelectTrigger id="operateur">
                        <SelectValue placeholder="Sélectionner…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orange">Orange Guinée</SelectItem>
                        <SelectItem value="mtn">MTN Guinée</SelectItem>
                        <SelectItem value="cellcom">Cellcom</SelectItem>
                        <SelectItem value="poste">Guinée Poste</SelectItem>
                        <SelectItem value="autre">Autre opérateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description des faits</Label>
                  <Textarea
                    id="description"
                    required
                    rows={6}
                    maxLength={2000}
                    placeholder="Dates, montants, références de dossier, démarches déjà effectuées…"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pieces">
                    Pièces justificatives (facultatif)
                  </Label>
                  <Input
                    id="pieces"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.png"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-1 justify-self-start"
                >
                  Déposer ma réclamation
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
