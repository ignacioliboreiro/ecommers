import Image from "next/image";
import Link from "next/link";

const TILES = [
  {
    slug: "smartphones",
    name: "Smartphones",
    image: "1562147458-0c12e8d29f50",
    span: "sm:col-span-3 sm:row-span-2",
  },
  {
    slug: "notebooks",
    name: "Notebooks",
    image: "1575909812264-6902b55846ad",
    span: "sm:col-span-3",
  },
  {
    slug: "audio",
    name: "Audio",
    image: "1528017486352-b49206ec821b",
    span: "sm:col-span-3",
  },
  {
    slug: "wearables",
    name: "Wearables",
    image: "1723622555972-37af178c623a",
    span: "sm:col-span-2",
  },
  {
    slug: "gaming",
    name: "Gaming",
    image: "1768560896018-186bbf942eda",
    span: "sm:col-span-2",
  },
  {
    slug: "camaras",
    name: "Cámaras",
    image: "1755396518003-a738d3252437",
    span: "sm:col-span-2",
  },
];

export function CategoryGrid() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Buscá por categoría</h2>
        <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Ver todo
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
        {TILES.map((tile, index) => (
          <Link
            key={tile.slug}
            href={`/products?category=${tile.slug}`}
            className={`group animate-in fade-in slide-in-from-bottom-4 fill-mode-both relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ${tile.span}`}
            style={{ animationDelay: `${index * 70}ms`, animationDuration: "500ms" }}
          >
            <Image
              src={`https://images.unsplash.com/photo-${tile.image}?w=900&h=700&fit=crop&q=80`}
              alt={tile.name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(min-width: 640px) 33vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute bottom-4 left-4 text-lg font-semibold text-white">
              {tile.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
