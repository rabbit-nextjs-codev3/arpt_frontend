"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { StatutBadge } from "@/components/site/StatutBadge";
import { equipements } from "@/data/mock";
import { cn } from "@/lib/utils";

const slides = equipements.flatMap((equipment) =>
  equipment.image ? [{ ...equipment, image: equipment.image }] : [],
);

export function EquipmentCarousel() {
  const [viewportRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: true, slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: false })],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section aria-label="Galerie des équipements" className="w-full min-w-0">
      <div ref={viewportRef} className="w-full overflow-hidden">
        <div className="flex touch-pan-y gap-4">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="group relative aspect-[4/3] min-w-0 shrink-0 basis-[86%] overflow-hidden rounded-2xl border border-border bg-white outline-none focus-visible:ring-2 focus-visible:ring-primary sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]"
              tabIndex={0}
            >
              <Image
                src={slide.image}
                alt={slide.nom}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 86vw"
                className="object-contain"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-5 pb-5 pt-14 text-white opacity-20 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus:opacity-100">
                <p className="font-heading text-lg font-semibold">{slide.nom}</p>
                <p className="mt-1 font-mono text-xs text-white/85">Réf. {slide.code}</p>
              </div>
              <StatutBadge
                statut={slide.statut}
                className="absolute right-3 top-3 z-10 border border-white/80 bg-white/95 px-3 py-1 shadow-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label="Équipement précédent"
          onClick={() => emblaApi?.scrollPrev()}
          className="grid size-10 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <div className="flex items-center gap-2" aria-label="Sélectionner une image">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Afficher l'image ${index + 1}`}
              aria-current={index === selectedIndex ? "true" : undefined}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "size-2.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                index === selectedIndex ? "bg-primary" : "bg-border hover:bg-primary/20",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Équipement suivant"
          onClick={() => emblaApi?.scrollNext()}
          className="grid size-10 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

