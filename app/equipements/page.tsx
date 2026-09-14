"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { StatutBadge } from "@/components/site/StatutBadge";
import { equipements, formaterDate } from "@/data/mock";


export default function Equipements() {
  const [recherche, setRecherche] = useState("");

  const resultats = useMemo(() => {
    const q = recherche.toLowerCase();
    return equipements.filter(
      (e) =>
        e.nom.toLowerCase().includes(q) ||
        e.marque.toLowerCase().includes(q) ||
        e.modele.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q),
    );
  }, [recherche]);

  return (
    <>
      <PageHero
        surtitre="Registre public"
        titre="Équipements et terminaux homologués"
        description="Avant tout achat ou importation, vérifiez le statut d'homologation d'un équipement radioélectrique auprès de l'ARPT."
      />

      <section className="section-y">
        <div className="container-content">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par marque, modèle ou code…"
              className="pl-9"
              aria-label="Rechercher un équipement"
            />
          </div>

          <div className="mt-8 overflow-x-auto border-y border-border">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-muted text-left">
                <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Équipement</th>
                  <th className="px-5 py-3 font-semibold">Marque / Modèle</th>
                  <th className="px-5 py-3 font-semibold">Catégorie</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Validité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resultats.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-muted/60">
                    <td className="px-5 py-4 font-mono text-xs text-primary">{e.code}</td>
                    <td className="px-5 py-4 font-medium">{e.nom}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {e.marque} · {e.modele}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{e.categorie}</td>
                    <td className="px-5 py-4">
                      <StatutBadge statut={e.statut} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {e.validite ? formaterDate(e.validite) : "—"}
                    </td>
                  </tr>
                ))}
                {resultats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      Aucun équipement trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

