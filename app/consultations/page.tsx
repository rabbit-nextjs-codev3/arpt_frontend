import { PageHero } from "@/components/site/PageHero";

export default function ConsultationsPage() {
  return (
    <>
      <PageHero
        surtitre="Consultations"
        titre="Consultations publiques"
        description="Les consultations publiques seront affichées ici."
      />

      <section className="section-y">
        <div className="container-content">
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-sm text-muted-foreground">
            Aucune consultation publique n&apos;est disponible pour le moment.
          </div>
        </div>
      </section>
    </>
  );
}
