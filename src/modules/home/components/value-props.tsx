import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const PROPS = [
  {
    icon: Truck,
    title: "Envío en 24/48hs",
    description: "A todo el país. Gratis en compras desde $150.000.",
  },
  {
    icon: ShieldCheck,
    title: "Pago protegido",
    description: "Stripe y Mercado Pago con verificación de firma en cada webhook.",
  },
  {
    icon: RotateCcw,
    title: "30 días de devolución",
    description: "Sin preguntas, siempre que el producto esté sin uso.",
  },
  {
    icon: BadgeCheck,
    title: "Garantía oficial",
    description: "12 meses de garantía directa con cada marca.",
  },
];

export function ValueProps() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {PROPS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-3">
            <Icon className="size-5 text-primary" aria-hidden />
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
