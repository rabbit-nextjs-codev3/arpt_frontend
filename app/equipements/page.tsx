"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { StatutBadge } from "@/components/site/StatutBadge";
import { formaterDate } from "@/data/mock";
import { useApiList, useContentBlock } from "@/lib/hooks";
import { useLocale } from "@/lib/locale-context";

interface HeroContent {
  surtitre: string;
  titre: string;
  description: string;
}

const HERO_DEFAUT: HeroContent = {
  surtitre: "Registre public",
  titre: "Équipements et terminaux homologués",
  description:
    "Avant tout achat ou importation, vérifiez le statut d'homologation d'un équipement radioélectrique auprès de l'ARPT.",
};

interface Equipement {
  id: number;
  uid: string;
  code: string;
  name: string;
  brand: string;
  model: string;
  status: "HOMOLOGUE" | "INTERDIT" | "EN_COURS";
  category: { id: number; slug: string; name: string };
  homologationNumber: string | null;
  validUntil: string | null;
}

export default function Equipements() {
  const t = useTranslations("equipmentPage");
  const { locale } = useLocale();
  const { data: hero } = useContentBlock<HeroContent>("equipment.hero", HERO_DEFAUT);
  const [recherche, setRecherche] = useState("");
  const { data: equipements, loading, error } = useApiList<Equipement>(`/equipment?lang=${locale}&pageSize=100`);

  const resultats = useMemo(() => {
    const q = recherche.toLowerCase();
    return equipements.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.model.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q),
    );
  }, [equipements, recherche]);

  return (
    <>
      <PageHero surtitre={hero.surtitre} titre={hero.titre} description={hero.description} />

      <section className="section-y">
        <div className="container-content">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
              aria-label={t("searchAriaLabel")}
            />
          </div>

          {loading && <p className="mt-6 text-sm text-muted-foreground">{t("loading")}</p>}
          {error && !loading && <p className="mt-6 text-sm text-destructive">{error}</p>}

          {!loading && !error && (
            <div className="mt-8 overflow-x-auto border-y border-border">
              <table className="w-full min-w-[52rem] text-sm">
                <thead className="bg-muted text-left">
                  <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="px-5 py-3 font-semibold">{t("code")}</th>
                    <th className="px-5 py-3 font-semibold">{t("equipment")}</th>
                    <th className="px-5 py-3 font-semibold">{t("brandModel")}</th>
                    <th className="px-5 py-3 font-semibold">{t("category")}</th>
                    <th className="px-5 py-3 font-semibold">{t("status")}</th>
                    <th className="px-5 py-3 font-semibold">{t("validity")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {resultats.map((e) => (
                    <tr key={e.uid} className="transition-colors hover:bg-muted/60">
                      <td className="px-5 py-4 font-mono text-xs text-primary">{e.code}</td>
                      <td className="px-5 py-4 font-medium">{e.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {e.brand} · {e.model}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{e.category.name}</td>
                      <td className="px-5 py-4">
                        <StatutBadge statut={e.status} />
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {e.validUntil ? formaterDate(e.validUntil) : "—"}
                      </td>
                    </tr>
                  ))}
                  {resultats.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        {t("empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
