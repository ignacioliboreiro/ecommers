"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="flex flex-col gap-6"
        >
          <motion.span
            variants={item}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            Nuevo ingreso · Halion Z9 Pro
          </motion.span>

          <motion.h1
            variants={item}
            className="max-w-md text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            La tecnología que vas a seguir usando en tres años.
          </motion.h1>

          <motion.p variants={item} className="max-w-md text-base text-muted-foreground">
            Curamos cada producto por autonomía, materiales y soporte real de posventa. Nada de
            relleno de catálogo.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-3">
            <Button render={<Link href="/products" />} nativeButton={false} size="lg" className="group/cta">
              Ver catálogo
              <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" />
            </Button>
            <Button
              render={<Link href="/products?category=audio" />}
              nativeButton={false}
              variant="outline"
              size="lg"
            >
              Explorar audio
            </Button>
          </motion.div>

          <motion.dl variants={item} className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Envío</dt>
              <dd className="text-sm font-medium tabular-nums">Gratis +$150.000</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Financiación</dt>
              <dd className="text-sm font-medium tabular-nums">Hasta 12 cuotas</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Devolución</dt>
              <dd className="text-sm font-medium tabular-nums">30 días</dd>
            </div>
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 }}
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative size-full overflow-hidden rounded-3xl bg-card ring-1 ring-white/10"
          >
            <Image
              src="https://images.unsplash.com/photo-1505468726633-0069fc52f4b9?w=900&h=900&fit=crop&q=80"
              alt="Halion Z9 Pro"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 448px, 90vw"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
