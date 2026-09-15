import Link from "next/link";
import { AuthTrigger } from "@/components/site/AuthModal";

const colonnes = [
  {
    titre: "L'Autorité",
    liens: [
      { to: "/a-propos", label: "Missions et organisation" },
      { to: "/actualites", label: "Actualités et communiqués" },
      { to: "/statistiques", label: "Observatoire du secteur" },
      { to: "/carrieres", label: "Carrières" },
    ],
  },
  {
    titre: "Démarches",
    liens: [
      { to: "/services", label: "Nos services" },
      { to: "/equipements", label: "Équipements homologués" },
      { to: "/reclamations", label: "Déposer une réclamation" },
      { to: "/appels-offres", label: "Appels d'offres" },
    ],
  },
  {
    titre: "Ressources",
    liens: [
      { to: "/reglementation", label: "Textes réglementaires" },
      { to: "/consultations", label: "Consultations publiques" },
      { to: "/contact", label: "Nous écrire" },
      { to: "/portail", label: "Portail usager" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto bg-institution text-primary-foreground">
      <div className="container-content grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-xl font-bold">ARPT Guinée</p>
          <p className="mt-3 text-sm leading-relaxed opacity-85">
            Autorité de Régulation des Postes et Télécommunications de la
            République de Guinée. Garante d'un secteur ouvert, concurrentiel et
            protecteur des usagers.
          </p>
        </div>

        {colonnes.map((col) => (
          <div key={col.titre}>
            <p className="font-heading text-sm font-semibold tracking-wide uppercase opacity-80">
              {col.titre}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.liens.map((l) => (
                <li key={l.to + l.label}>
                  {l.to === "/portail" ? (
                    <AuthTrigger className="text-left opacity-85 transition-opacity hover:opacity-100">
                      {l.label}
                    </AuthTrigger>
                  ) : (
                    <Link
                      href={l.to}
                      className="opacity-85 transition-opacity hover:opacity-100"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
