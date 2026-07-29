import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PromoBanner() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="grid overflow-hidden rounded-3xl bg-card ring-1 ring-white/10 lg:grid-cols-2">
        <div className="relative aspect-[4/3] lg:aspect-auto">
          <Image
            src="https://images.unsplash.com/photo-1575909812264-6902b55846ad?w=1100&h=900&fit=crop&q=80"
            alt="Rhomb 16 Creator"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <div className="flex flex-col justify-center gap-4 p-8 sm:p-12">
          <span className="text-xs font-medium tracking-wide text-primary uppercase">
            Notebooks para creadores
          </span>
          <h2 className="max-w-sm text-3xl font-semibold tracking-tight">
            Rhomb 16 Creator: pantalla calibrada y GPU dedicada.
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Edición de foto y video sin cuellos de botella. Chasis de aluminio, 32GB de RAM y hasta
            1TB de almacenamiento.
          </p>
          <Button
            render={<Link href="/products/rhomb-16-creator" />}
            nativeButton={false}
            className="group/cta mt-2 w-fit"
          >
            Conocer el modelo
            <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
