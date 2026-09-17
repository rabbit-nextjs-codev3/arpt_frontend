import { cn } from "@/lib/utils";
import { libelleStatut, type Statut } from "@/data/mock";

const styles: Record<Statut, string> = {
  NOUVEAU: "bg-accent text-accent-foreground",
  EN_COURS: "bg-warning/15 text-warning-foreground",
  TRAITE: "bg-success/15 text-success",
  RESOLU: "bg-success/15 text-success",
  REJETE: "bg-destructive/12 text-destructive",
  OUVERT: "bg-success/15 text-success",
  OUVERTE: "bg-success/15 text-success",
  CLOTURE: "bg-muted text-muted-foreground",
  CLOTUREE: "bg-muted text-muted-foreground",
  ANNULE: "bg-destructive/12 text-destructive",
  HOMOLOGUE: "bg-success/15 text-success",
  INTERDIT: "bg-destructive/12 text-destructive",
  ACCEPTE: "bg-success/15 text-success",
  REFUSE: "bg-destructive/12 text-destructive",
};

export function StatutBadge({ statut, className }: { statut: Statut; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        styles[statut],
        className,
      )}
    >
      {libelleStatut[statut]}
    </span>
  );
}
