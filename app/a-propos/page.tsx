"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Mail,
  MessageSquareWarning,
  Phone,
  Scale,
  TrendingUp,
  Users,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHero, SectionTitle } from "@/components/site/PageHero";
import { MemberCarousel } from "@/components/site/MemberCarousel";
import { Button } from "@/components/ui/button";
import { useApiOne, useContentBlock } from "@/lib/hooks";

const ICONES_AUTORITE = {
  scale: Scale,
  radio: Radio,
  users: Users,
  shield: ShieldCheck,
  building: Building2,
  trending: TrendingUp,
  mail: Mail,
} as const;

type IconeAutorite = keyof typeof ICONES_AUTORITE;

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

interface BannerContent {
  image: string;
  phrase: string;
}

interface ImageContent {
  image: string;
}

interface MissionItem {
  icone: IconeAutorite;
  titre: string;
  texte: string;
}

interface DirectionItem {
  icone: IconeAutorite;
  nom: string;
  texte: string;
}

interface TimelineItem {
  annee: string;
  texte: string;
}

interface CouncilMember {
  name: string;
  role: string;
  image: string;
}

interface SupportContent {
  description: string;
}

interface SiteConfigPublic {
  contactInfo: { phone?: string; email?: string };
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "L'Autorité",
  titre: "Une institution au service d'un marché numérique équitable",
  description:
    "L'ARPT est l'autorité administrative indépendante chargée de la régulation des secteurs des postes et des télécommunications en République de Guinée.",
};

const BANNER_DEFAUT: BannerContent = {
  image: "/images/hero-arpt.jpg",
  phrase: "Réguler les infrastructures qui connectent la Guinée",
};

const MISSIONS_IMAGE_DEFAUT: ImageContent = { image: "/images/arpt/controle-qualite.jpg" };
const TEAM_IMAGE_DEFAUT: ImageContent = { image: "/images/group.jpeg" };

const MISSIONS_DEFAUT: MissionItem[] = [
  { icone: "scale", titre: "Garantir une concurrence loyale", texte: "Surveiller les marchés, encadrer les tarifs d'interconnexion et prévenir les pratiques anticoncurrentielles." },
  { icone: "radio", titre: "Gérer les ressources rares", texte: "Planifier et attribuer le spectre radioélectrique ainsi que les ressources en numérotation." },
  { icone: "users", titre: "Protéger les consommateurs", texte: "Traiter les réclamations, contrôler la qualité de service et informer les usagers de leurs droits." },
  { icone: "shield", titre: "Sécuriser le secteur", texte: "Homologuer les équipements, contrôler les opérateurs et veiller au respect du cadre légal." },
];

const DIRECTIONS_DEFAUT: DirectionItem[] = [
  { icone: "building", nom: "Direction générale", texte: "Pilotage stratégique, représentation institutionnelle et coordination de l'ensemble des directions." },
  { icone: "radio", nom: "Direction technique et du spectre", texte: "Planification des fréquences, contrôle du spectre et homologation des équipements radioélectriques." },
  { icone: "scale", nom: "Direction des affaires juridiques", texte: "Élaboration des textes réglementaires, avis juridiques et suivi des contentieux sectoriels." },
  { icone: "users", nom: "Direction des consommateurs", texte: "Traitement des réclamations des usagers et actions de sensibilisation sur leurs droits." },
  { icone: "trending", nom: "Direction de l'économie et des marchés", texte: "Analyse tarifaire, observatoire du secteur et surveillance de la concurrence entre opérateurs." },
  { icone: "mail", nom: "Direction du secteur postal", texte: "Régulation, autorisation et développement des activités postales et de courrier express." },
];

const TIMELINE_DEFAUT: TimelineItem[] = [
  { annee: "2005", texte: "Création de l'Autorité de régulation du secteur." },
  { annee: "2015", texte: "Adoption de la loi L/2015/018/AN sur les télécommunications et les TIC." },
  { annee: "2016", texte: "Nouvelle organisation de l'ARPT par décret présidentiel." },
  { annee: "2026", texte: "Lancement du chantier d'attribution des fréquences 5G." },
];

const COUNCIL_DEFAUT: CouncilMember[] = [
  { name: "M. Mamady Doumbouya", role: "Directeur général", image: "/images/arpt/mamady-doumbouya.jpeg" },
  { name: "M. Adama Condé", role: "Directeur général adjoint", image: "/images/arpt/adama-conde.jpg" },
  { name: "M. Fany Zeze Camara", role: "Membre", image: "/images/arpt/zeze.jpeg" },
];

const SUPPORT_DEFAUT: SupportContent = {
  description:
    "Notre équipe vous oriente vers le bon service pour vos démarches, vos réclamations et vos questions réglementaires.",
};

export default function APropos() {
  const t = useTranslations("about");
  const { data: hero } = useContentBlock<HeroContent>("about.hero", HERO_DEFAUT);
  const { data: banner } = useContentBlock<BannerContent>("about.banner", BANNER_DEFAUT);
  const { data: missionsImage } = useContentBlock<ImageContent>("about.missionsImage", MISSIONS_IMAGE_DEFAUT);
  const { data: missions } = useContentBlock<MissionItem[]>("about.missions", MISSIONS_DEFAUT);
  const { data: directions } = useContentBlock<DirectionItem[]>("about.directions", DIRECTIONS_DEFAUT);
  const { data: reperes } = useContentBlock<TimelineItem[]>("about.timeline", TIMELINE_DEFAUT);
  const { data: teamImage } = useContentBlock<ImageContent>("about.teamImage", TEAM_IMAGE_DEFAUT);
  const { data: council } = useContentBlock<CouncilMember[]>("about.council", COUNCIL_DEFAUT);
  const { data: support } = useContentBlock<SupportContent>("about.support", SUPPORT_DEFAUT);
  const { data: config } = useApiOne<SiteConfigPublic>("/site-config");

  return (
    <>
      <PageHero surtitre={hero.surtitre} titre={hero.titre} description={hero.description} />

      {/* Bandeau photo — ancre institutionnelle dès l'ouverture de page */}
      <section className="relative h-[22rem] w-full overflow-hidden md:h-[28rem]">
        <Image
          src={banner.image}
          alt={t("bannerAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.55)_100%)]" />
        <div className="container-content absolute inset-x-0 bottom-0 pb-8">
          <p className="max-w-xl text-balance text-lg font-semibold text-white md:text-xl">{banner.phrase}</p>
        </div>
      </section>

      <section className="section-y">
        <div className="container-content grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-border">
            <Image
              src={missionsImage.image}
              alt={t("missionsImageAlt")}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <SectionTitle surtitre={t("missionsSurtitre")} titre={t("missionsTitre")} />
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {missions.map((m, i) => {
                const Icone = ICONES_AUTORITE[m.icone] ?? Scale;
                return (
                  <article key={i} className="border-t border-border pt-6">
                    <span className="flex size-11 items-center text-primary">
                      <Icone className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-heading text-lg font-semibold">{m.titre}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.texte}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section-y bg-surface">
        <div className="container-content grid gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle
              surtitre={t("orgSurtitre")}
              titre={t("orgTitre")}
              description={t("orgDescription")}
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {directions.map((d, i) => {
                const Icone = ICONES_AUTORITE[d.icone] ?? Building2;
                return (
                  <article
                    key={i}
                    className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-accent text-primary">
                      <Icone className="size-4.5" aria-hidden />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold">{d.nom}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{d.texte}</p>
                  </article>
                );
              })}
            </div>
          </div>
          <div>
            <SectionTitle surtitre={t("timelineSurtitre")} titre={t("timelineTitre")} />
            <ol className="mt-8 space-y-6 border-l-2 border-border pl-6">
              {reperes.map((r, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 left-[-1.9rem] size-3 rounded-full bg-gold" />
                  <p className="font-heading font-semibold text-primary">{r.annee}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.texte}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-content">
          <div className="relative h-64 overflow-hidden rounded-2xl border border-border md:h-80">
            <Image
              src={teamImage.image}
              alt={t("teamImageAlt")}
              fill
              sizes="100vw"
              className="object-cover object-top"
            />
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <SectionTitle
                surtitre={t("teamSurtitre")}
                titre={t("teamTitre")}
                description={t("teamDescription")}
              />
              <div className="mt-8">
                <MemberCarousel members={council} />
              </div>
            </div>
            <aside className="rounded-2xl border border-border bg-surface p-6 lg:p-8">
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">{t("supportLabel")}</p>
              <h2 className="mt-3 font-heading text-2xl font-semibold">{t("supportTitle")}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{support.description}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/contact">
                    {t("contactUs")} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/reclamations">
                    <MessageSquareWarning className="size-4" aria-hidden /> {t("fileClaim")}
                  </Link>
                </Button>
              </div>
              <div className="mt-7 grid gap-4 border-t border-border pt-5 text-sm">
                {config?.contactInfo?.phone && (
                  <a href={`tel:${config.contactInfo.phone}`} className="flex items-center gap-3 font-medium hover:text-primary">
                    <Phone className="size-4 text-primary" aria-hidden /> {config.contactInfo.phone}
                  </a>
                )}
                {config?.contactInfo?.email && (
                  <a
                    href={`mailto:${config.contactInfo.email}`}
                    className="flex items-center gap-3 font-medium hover:text-primary"
                  >
                    <Mail className="size-4 text-primary" aria-hidden /> {config.contactInfo.email}
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
