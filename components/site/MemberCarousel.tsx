"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Member {
  name: string;
  role: string;
  image: string;
}

export function MemberCarousel({ members }: { members: Member[] }) {
  const [viewportRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4800, stopOnInteraction: false }),
  ]);
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

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun membre à afficher pour l'instant.
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={viewportRef}>
        <div className="flex touch-pan-y">
          {members.map((member) => (
            <article key={member.name} className="min-w-0 flex-[0_0_100%] px-1">
              <div className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:grid-cols-[0.8fr_1.2fr]">
                <div className="relative aspect-video bg-muted sm:aspect-auto sm:min-h-80">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(min-width: 640px) 35vw, 100vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="flex flex-col justify-center p-6 lg:p-8">
                  <p className="text-xs font-semibold tracking-[0.16em] text-teal-700 uppercase">
                    Direction générale
                  </p>
                  <h3 className="mt-3 font-heading text-2xl font-semibold">
                    {member.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {member.role}
                  </p>
                  <p className="mt-6 border-l-2 border-gold pl-4 text-sm leading-6 text-muted-foreground">
                    Une gouvernance tournée vers une régulation transparente,
                    collaborative et centrée sur la qualité de service.
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex gap-2" aria-label="Sélectionner un membre">
          {members.map((member, index) => (
            <button
              key={member.name}
              type="button"
              aria-label={`Afficher ${member.name}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "size-2.5 rounded-full transition-colors",
                index === selectedIndex
                  ? "bg-teal-600"
                  : "bg-border hover:bg-teal-600/50",
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Membre précédent"
            onClick={() => emblaApi?.scrollPrev()}
            className="grid size-9 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Membre suivant"
            onClick={() => emblaApi?.scrollNext()}
            className="grid size-9 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
