"use client";

import { Mail, Phone, Scale, Users, Radio, ShieldCheck } from "lucide-react";
import { PageHero, SectionTitle } from "@/components/site/PageHero";
import { MemberCarousel } from "@/components/site/MemberCarousel";

const missions = [
  {
    icon: Scale,
    titre: "Garantir une concurrence loyale",
    texte:
      "Surveiller les marchés, encadrer les tarifs d'interconnexion et prévenir les pratiques anticoncurrentielles.",
  },
  {
    icon: Radio,
    titre: "Gérer les ressources rares",
    texte:
      "Planifier et attribuer le spectre radioélectrique ainsi que les ressources en numérotation.",
  },
  {
    icon: Users,
    titre: "Protéger les consommateurs",
    texte:
      "Traiter les réclamations, contrôler la qualité de service et informer les usagers de leurs droits.",
  },
  {
    icon: ShieldCheck,
    titre: "Sécuriser le secteur",
    texte:
      "Homologuer les équipements, contrôler les opérateurs et veiller au respect du cadre légal.",
  },
];

const directions = [
  "Direction générale",
  "Direction technique et du spectre",
  "Direction des affaires juridiques",
  "Direction des consommateurs",
  "Direction de l'économie et des marchés",
  "Direction du secteur postal",
];

const reperes = [
  { annee: "2005", texte: "Création de l'Autorité de régulation du secteur." },
  {
    annee: "2015",
    texte:
      "Adoption de la loi L/2015/018/AN sur les télécommunications et les TIC.",
  },
  {
    annee: "2016",
    texte: "Nouvelle organisation de l'ARPT par décret présidentiel.",
  },
  {
    annee: "2026",
    texte: "Lancement du chantier d'attribution des fréquences 5G.",
  },
];

export default function APropos() {
  return (
    <>
      <PageHero
        surtitre="L'Autorité"
        titre="Une institution au service d'un marché numérique équitable"
        description="L'ARPT est l'autorité administrative indépendante chargée de la régulation des secteurs des postes et des télécommunications en République de Guinée."
      />

      <section className="section-y">
        <div className="container-content">
          <SectionTitle
            surtitre="Nos missions"
            titre="Quatre responsabilités fondamentales"
          />
          <div className="mt-10 grid gap-x-16 gap-y-10 md:grid-cols-2">
            {missions.map((m) => (
              <article key={m.titre} className="border-t border-border pt-6">
                <span className="flex size-11 items-center text-primary">
                  <m.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold">
                  {m.titre}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {m.texte}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-content grid gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle surtitre="Organisation" titre="Nos directions" />
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {directions.map((d) => (
                <li key={d} className="py-4 text-sm font-medium">
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionTitle surtitre="Repères" titre="Quelques dates clés" />
            <ol className="mt-8 space-y-6 border-l-2 border-border pl-6">
              {reperes.map((r) => (
                <li key={r.annee} className="relative">
                  <span className="absolute top-1.5 left-[-1.9rem] size-3 rounded-full bg-gold" />
                  <p className="font-heading font-semibold text-primary">
                    {r.annee}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.texte}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-content grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="min-w-0">
            <SectionTitle
              surtitre="Direction générale"
              titre="Une équipe au service du secteur"
              description="Découvrez les responsables qui portent la mission de l'ARPT et accompagnent la transformation numérique de la Guinée."
            />
            <div className="mt-8 min-w-0">
              <MemberCarousel />
            </div>
          </div>
          <aside className="rounded-2xl border border-border bg-surface p-6 lg:p-8">
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              Support ARPT
            </p>
            <h2 className="mt-3 font-heading text-2xl font-semibold">
              Besoin d'un accompagnement ?
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Notre équipe vous oriente vers le bon service pour vos démarches,
              vos réclamations et vos questions réglementaires.
            </p>
            <div className="mt-7 grid gap-4 border-t border-border pt-5 text-sm">
              <a
                href="tel:+224669221000"
                className="flex items-center gap-3 font-medium hover:text-primary"
              >
                <Phone className="size-4 text-primary" aria-hidden /> +224 669
                221 000
              </a>
              <a
                href="mailto:contact@arpt.gov.gn"
                className="flex items-center gap-3 font-medium hover:text-primary"
              >
                <Mail className="size-4 text-primary" aria-hidden />{" "}
                contact@arpt.gov.gn
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
