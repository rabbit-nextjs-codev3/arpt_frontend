import type { ReactNode } from "react";

export function PageHero({
  surtitre,
  titre,
  description,
  children,
}: {
  surtitre?: string;
  titre: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface text-foreground">
      {/* Layered background: soft accent bloom + fine texture, kept subtle so text stays king */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,color-mix(in_oklab,var(--color-accent)_55%,transparent)_100%)]" />
        <div className="absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--color-accent)_35%,transparent)] blur-3xl" />
      </div>

      <div className="container-content relative py-14 md:py-20">
        {surtitre && (
          <p className="font-heading text-xs font-semibold tracking-[0.18em] text-teal-700 uppercase">
            {surtitre}
          </p>
        )}
        <div className="mt-4 h-1 w-14 rounded-full bg-gold" aria-hidden />
        <h1 className="mt-5 max-w-3xl text-balance text-3xl leading-tight font-bold tracking-tight md:text-5xl">
          {titre}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}

export function SectionTitle({
  surtitre,
  titre,
  description,
}: {
  surtitre?: string;
  titre: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      {surtitre && (
        <p className="font-heading text-xs font-semibold tracking-[0.18em] text-teal-600 uppercase">
          {surtitre}
        </p>
      )}
      <div className="mt-3 h-0.5 w-10 rounded-full bg-gold" aria-hidden />
      <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight md:text-3xl">
        {titre}
      </h2>
      {description && (
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
