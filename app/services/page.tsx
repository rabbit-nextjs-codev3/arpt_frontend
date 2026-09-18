"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Clock, Coins, FileCheck2 } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { useApiList, useContentBlock } from "@/lib/hooks";

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "Démarches",
  titre: "Services aux opérateurs, entreprises et particuliers",
  description:
    "Pour chaque service, retrouvez les pièces exigées, le délai d'instruction et le coût applicable. Les demandes se déposent en ligne depuis le portail usager.",
};

interface Service {
  id: number;
  uid: string;
  name: string;
  description: string;
  requiredDocuments: string[];
  delai: string;
  cost: string | null;
}

export default function Services() {
  const t = useTranslations("servicesPage");
  const { data: hero } = useContentBlock<HeroContent>("services.hero", HERO_DEFAUT);
  const { data: services, loading, error } = useApiList<Service>("/services?lang=fr&pageSize=50");

  return (
    <>
      <PageHero surtitre={hero.surtitre} titre={hero.titre} description={hero.description} />

      <section className="section-y">
        <div className="container-content">
          {loading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
          {error && !loading && <p className="text-sm text-destructive">{error}</p>}

          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
            {services.map((s) => (
              <article key={s.uid} className="flex flex-col border-t border-border pt-7">
                <h2 className="font-heading text-xl font-semibold">{s.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.description}</p>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 py-1 text-sm">
                    <Clock className="size-4 shrink-0 text-primary" aria-hidden />
                    <dt className="sr-only">{t("delay")}</dt>
                    <dd>{s.delai}</dd>
                  </div>
                  <div className="flex items-start gap-2 py-1 text-sm">
                    <Coins className="size-4 shrink-0 text-primary" aria-hidden />
                    <dt className="sr-only">{t("cost")}</dt>
                    <dd>{s.cost ?? t("officialSchedule")}</dd>
                  </div>
                </dl>

                {s.requiredDocuments.length > 0 && (
                  <>
                    <p className="mt-6 font-heading text-sm font-semibold">{t("requiredDocuments")}</p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {s.requiredDocuments.map((d) => (
                        <li key={d} className="flex items-start gap-2">
                          <FileCheck2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <Button asChild className="mt-7 self-start">
                  <Link href={`/contact?service=${s.uid}`}>{t("submitRequest")}</Link>
                </Button>
              </article>
            ))}
          </div>

          {!loading && !error && services.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}
        </div>
      </section>
    </>
  );
}
